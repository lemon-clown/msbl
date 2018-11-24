
# 问题
在 ssm 框架的编程中，Mapper 通常只有一个接口，该接口的实现通过注解或者外部 xml 的方式经由 spring 注入，也因此 Mapper 中只能够做基本的 sql 操作，不能包含其他业务逻辑，于是通常有一层 service 来管理 mapper，更上面的 controller 层直接使用 service。

但是，一个 service 通常可能需要操作多个 mapper （事务），而同时，一个 service 也可能需要调用其它的 service 中的方法，这在一定程度上产生了一些混乱，因为本质上来说，一个需要多个 mapper 支持的事务操作也只是一个数据库操作而已；此外，mapper 应该被认为是很底层的方法，应该尽量避免被上层类直接操作，比如现在想要统计某一个插入操作的耗时情况，如果是在 service 层中封装了 mapper 层的函数，并形如 service.xxx() 来调用，那么你可以很安全的直接在 service.xxx() 中添加额外的操作。

# 解决方案
不难想见，如果 service 能够直接继承 mapper 中的方法，并只需在适当的情况下 Override 相应的方法，即可相当灵活地添加额外的操作，并且对外部是透明的；更棒地是，我们通常无须再添加额外的代码，即可在 service 中实时获得 mapper 中的函数。

但是，由于我们只能拿到一个 mapper 的接口，因此不能简单地通过继承来实现上述的想法。经过一番考虑，笔者认为使用 lombok 那种基于注解生成代码的方式是最简洁优雅的，但是由于精力/能力有限，最后还是选择一个比较简单的方式来实现：在 service 包下新建一个子包 base，并针对每一个 Mapper 创建一个 ServiceBase 类，它将代理从 spring 容器获得的该 Mapper 实例的所有方法（因此它会 implements 该 Mapper），并在 ServiceImpl 中继承相应的ServiceBase；除此之外，你还需要事先在 Service 中显式的扩展相应的 Mapper 接口，并在 ServiceImpl 中继承相应的 ServiceBase。

可以发现，base 中的所有内容完全可以使用脚本通过解析 mapper 包中的类而自动生成，而在 service 中的修改则是仅需修改一次，而以后 mapper 修改后，直接运行脚本覆盖掉 base 中的内容就好了。

## 举个栗子
<span id="id-example-1"></span>
省略了 `import 语句`。
```java
// CatMapper
package me.clown.lemon.demo.dao.ibatis;

public interface CatMapper {
    int deleteByPrimaryKey(Integer id);
}
```

```java
// CustomCatMapper
package me.clown.lemon.demo.dao.custom;

public interface CustomCatMapper {
    Cat getCatById(Integer catId);
}
```

```java
// CatService
package me.clown.lemon.demo.web.service;

public interface CatService extends CatMapper, CustomCatMapper {
    int updateCat(Cat cat);
}
```

```java
// CatServiceBase
package clown.lemon.demo.web.service.base;

@Component
public class CatServiceBase implements CatMapper, CustomCatMapper {
    @Autowired
    private CatMapper catMapper;
    
    @Autowired
    private CustomCatMapper customCatMapper;

	  int deleteByPrimaryKey(Integer id) {
      return catMapper.deleteByPrimaryKey(id);
	  }

    @Override
    Cat getCatById(Integer catId) {
        return customCatMapper.getCatById(catId);
    }
}
```

```java
// CatServiceImpl
package clown.lemon.demo.web.service.impl;

import clown.lemon.demo.dao.CatMapper;
import clown.lemon.demo.web.service.base.CatServiceBase;
import clown.lemon.demo.web.service.CatService;

public class CatServiceImpl extends CatServiceBase implements CatService {
    @Override
    int updateCat(Cat cat) {
        System.out.println("update cat " + cat.getId + ".");
        return 0;
    }
}
```

如果现在需要在删除操作时同时写入一个日志，就可以直接在 `CatServiceImpl` 中重载 `int deleteByPrimaryKey(Integer id)` 方法，其它调用的地方无需做改动。

# 安装
```shell
# 使用 npm 安装
npm install -g msbl

# 使用 yarn 安装
yarn global add msbl
```

# 使用
注意：**msbl v1.x.y** 用法不和 **v0.a.b** 兼容。

## 配置文件
需要指定一个配置文件，默认执行命令所在的路径下的 msbl.config.yml（当然也可以通过命令行选项指定文件路径，但必须是 `yaml` 文件）

下面是 `msbl.config.yml` 的简要说明（对应 [上文中的栗子](#id-example-1)）：
```yml
# 全局选项
global:
  encoding: UTF-8

# 子命令 generate 的配置
generate:
  # 覆盖文件操作等，是否需要等待用户确认，若未 true，则无需确认
  force: false

  # ServiceBase 相关的配置
  service:
    # ServiceBase 生成时放置的文件夹
    path: src/main/java/me/clown/lemon/demo/service/base
    # ServiceBase 所在的包
    package: me.clown.lemon.demo.service.base
    # 生成的 ServiceBase 的后缀名
    suffix: ServiceBase

  # mapper 相关的配置，类似 ServiceBase 配置，字段含义不再赘述。
  # 由于可能需要多个 mapper 由一个 serviceBase 代理，因此，每个 mapper 还需要额外配置 `prefix`，
  # 当一个 mapper 去掉 prefix 和 suffix 后，将被 'group'，同一个 'group' 中的 mapper，将由
  # 同一个 ServiceBase 所代理，如上文中的 CatService 和 CustomCatMapper 由 CatServiceBase 所代理
  mappers:
    -
      path: src/main/java/me/clown/lemon/demo/dao/ibatis
      package: me.clown.lemon.demo.dao.ibatis
      suffix: Mapper
    -
      path: src/main/java/me/clown/lemon/demo/dao/custom
      package: me.clown.lemon.demo.dao.custom
      prefix: Custom
      suffix: Mapper
```

## 命令
```shell
msbl genereate [-c <config-path>] [-e <encoding>] [--force]
```

### 参数说明
* -c：指定配置文件所在的路径
* -e：指定项目中的源码文件的编码方式
* -f：由于可能多次执行，因此会碰到需要 overwrite 文件的情况，如果指定 `force`，则无需用户确认“是否执行覆盖”