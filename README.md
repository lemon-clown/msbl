
# 问题
在 ssm 框架的编程中，Mapper 通常只有一个接口，该接口的实现通过注解或者外部 xml 的方式经由 spring 注入，也因此 Mapper 中只能够做基本的 sql 操作，不能包含其他业务逻辑，于是通常有一层 service 来管理 mapper，更上面的 controller 层直接使用 service。

但是，一个 service 通常可能需要操作多个 mapper （事务），而同时，一个 service 也可能需要调用其它的 service 中的方法，这在一定程度上产生了一些混乱，因为本质上来说，一个需要多个 mapper 支持的事务操作也只是一个数据库操作而已；此外，mapper 应该被认为是很底层的方法，应该尽量避免被上层类直接操作，比如现在想要统计某一个插入操作的耗时情况，如果是在 service 层中封装了 mapper 层的函数，并形如 service.xxx() 来调用，那么你可以很安全的直接在 service.xxx() 中添加额外的操作。

# 解决方案
不难想见，如果 service 能够直接继承 mapper 中的方法，并只需在适当的情况下 Override 相应的方法，即可相当灵活地添加额外的操作，并且对外部是透明的；更棒地是，我们通常无须再添加额外的代码，即可在 service 中实时获得 mapper 中的函数。

但是，由于我们只能拿到一个 mapper 的接口，因此不能简单地通过继承来实现上述的想法。经过一番考虑，笔者认为使用 lombok 那种基于注解生成代码的方式是最简洁优雅的，但是由于精力/能力有限，最后还是选择一个比较简单的方式来实现：在 service 包下新建一个子包 base，并针对每一个 Mapper 创建一个 ServiceBase 类，它将代理从 spring 容器获得的该 Mapper 实例的所有方法（因此它会 implements 该 Mapper），并在 ServiceImpl 中继承相应的ServiceBase；除此之外，你还需要事先在 Service 中显式的扩展相应的 Mapper 接口，并在 ServiceImpl 中继承相应的 ServiceBase。

可以发现，base 中的所有内容完全可以使用脚本通过解析 mapper 包中的类而自动生成，而在 service 中的修改则是仅需修改一次，而以后 mapper 修改后，直接运行脚本覆盖掉 base 中的内容就好了。

## 举个栗子
```java
// CatMapper
package clown.lemon.demo.dao;

public interface CatMapper {
    Cat getCatById(Integer catId);
}
```

```java
// CatService
package clown.lemon.demo.web.service;

import clown.lemon.demo.dao.CatMapper;

public interface CatService extends CatMapper {
    int deleteCatByCatId(Integer catId);
}
```

```java
// CatServiceBase
package clown.lemon.demo.web.service.base;

import clown.lemon.demo.dao.CatMapper;
import org.springframework.beans.factory.annotation.Autowired;

public class CatServiceBase implements CatMapper {
    @Autowired
    private CatMapper catMapper;

    @Override
    Cat getCatById(Integer catId) {
        return catMapper.getCatById(catId);
    }
}
```

```java
// CatServiceBase
package clown.lemon.demo.web.service.impl;

import clown.lemon.demo.dao.CatMapper;
import clown.lemon.demo.web.service.base.CatServiceBase;
import clown.lemon.demo.web.service.CatService;

public class CatServiceImpl extends CatServiceBase implements CatService {
    @Override
    int deleteCatByCatId(Integer catId) {
        System.out.println("delete cat " + catId + ".");
        return 0;
    }
}
```

# 安装
```shell
# 使用 npm 安装
npm install -g msbl

# 使用 yarn 安装
yarn global add msbl
```

# 使用
```shell
msbl <from> <to> -s <source-class-suffix> -t <target-class-suffix>
```

## 参数说明
* from: mapper 所在的文件夹路径
* to: service/manager 所在的文件件路径
* -s: 指定 mapper 的后缀名，通常被指定为 `Mapper`、`Dao` 等，默认为 from 的最后一段路径的首字母大写的值
* -t: 指定 service 的后缀名，通常被指定为 `Service`、`Manager` 等，默认为 to 的最后一段路径的首字母大写的值
