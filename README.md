# blqw.taskq (*还没开始写代码, 只写了文档)
js 任务队列

## 一、获取对象
### 1. js
```html
 <script src="taskq.js"></script>
```

### 2. AMD
```js
require(["taskq"], function (taskq) {

});
```

## 二、基本概念及功能定义
`taskq` 主要解决多个异步任务顺序执行的场景   
保证同一时间只有一个任务进行, 完成后继续下一个  

### 1. 同步任务
`append` 方法追加的任务将被顺序执行
```js
taskq.append(function(q){
    console.log(1);
}); 
...
taskq.append(function(q){
    console.log(2);
}); 
...
taskq.append(function(q){
    console.log(3);
}); 
```

### 2. 异步任务

```js
taskq.append(function(q){
    q.async(); //表示这个是一个异步任务
    setTimeout(function(){
        ...
        q.next(); //异步任务, 需要调用 q.next() 表示异步完成
    },1000);
}); 
taskq.append(fetch, ['api/v1/user/1',taskq], 
    function(response){
        ...
    },
    function(error){
        ...
    }
);
taskq.append(function(q, $){
    q.async();
    $.getJSON('api/v1/user/1')
        .done(function(data){q.next(data);})
        .fail(function(err){q.error(err);});
    }, [taskq, jQuery], function(data){
        ...
    });
```

### 3. 异常处理
```js
//只能设置一个 onerror 处理函数
task.onerror = function(q, error){
    // error === Error("error test");
    // q.clear() 清空后续任务
    // q.suspend() 挂起任务
    // q.resume() 恢复任务执行
    // q.reset() 重置任务队列
    // 如果不进行任何操作将会继续下一个任务
}; 
taskq.append(function(q){
    console.log("1");
});
taskq.append(function(q){
    throw new Error("error test"); //转入onerror
    console.log("2");
});
taskq.append(function(q){
    console.log("3");
});

```

### 4. 全局队列 和 独立队列
`taskq`本身是全局共享的
```js
//如果希望开启一个独立的任务队列可以
var new_taskq = taskq.new();
// 重新得到全局队列
var taskq = new_taskq.global();
```

## 三、APIs

### taskq
api | 说明 | 详细
:---|:---|:---
append()|追加任务|[查看](apidoc/append.md)
new()|返回新的taskq对象|`new_taskq = taskq.new()`
global()|返回全局taskq对象|`taskq = new_taskq.global()`
reset()|重置任务|清空任务队列, 并抛弃正在执行的任务)
clear()|清空任务|清空任务队列 当前正在执行的任务不受影响)
suspend()|挂起队列|当前任务执行完成之后不进入下一任务, 直到主动调用`resume`)
resume()|恢复队列|继续执行被挂起的队列)
onerror|异常处理函数|队列任务出现任何异常, 进入该方法)
status|返回当前队列的状态|"idle", "running", "suspend"

### 参数`q`
api | 说明 | 详细
:---|:---|:---
async()|声明当前方法为异步|表示当前任务结束后不开始下一个任务, 等待`q.next()`信号
resolve(result)|当前任务结束|[参照](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)
next(result)|功能同上|`resolve`的别名
reject(result)|当前任务出错|[参照](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject)
error(result)|功能同上|`reject`的别名
append(any)|追加子任务|参考`taskq.append`, 被添加的任务, 在当前任务结束, 下个任务之前执行

