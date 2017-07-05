# blqw.taskq
js 任务队列

## 一、获取对象
### 1. js
```html
 <script src="taskq.js"></script>
 <script>
    taskq.append(...);
 </script>
```

### 2. AMD
```js
require(["taskq"], function (taskq) {
    taskq.append(function(tq){ //默认添加的任务为异步
        setTimeout(function(){
            tq.next(); //用于通知任务已经完成
        }, this.millisec);
    }, { millisec: 1000 } /* 表示中的作用域 */ );
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
taskq.append(function(q){
    console.log(2);
}); 
taskq.append(function(q){
    console.log(3);
}); 
```

### 2. 一般异步任务

```js
taskq.append(function(q){
    q.async(); //表示这个是一个异步任务
    setTimeout(function(){
        //balabala...
        q.next(); //异步任务, 需要调用 q.next() 表示异步完成
    },1000);
}); 
taskq.append(function(q){
    q.async(); //表示这个是一个异步任务
    $.get("api/v1/user/1").done(function(result){
        q.next(); //异步任务, 需要调用 q.next() 表示异步完成
    },1000);
}); 

taskq.appendAsync(function(q){
    //使用 appendAsync 就不需要单独调用 q.async();
    $.get("api/v1/user/1").done(function(result){
        q.next(); //异步任务, 需要调用 q.next() 表示异步完成
    },1000);
}); 
//不推荐 appendAsync
```

### 3. Promise
[Promise 例子](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise#示例)
```js
taskq.append(...);
taskq.append(new Promise(function(resolve, reject){
    setTimeout(function(){
        resolve("成功!");
    }, 250);
}).then(function(successMessage){
    console.log("Yay! " + successMessage);
})); 
taskq.append(function(q){
    //...
});
```

### 4. Fetch
[Fetch_API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch#进行_fetch_请求)   
例子中的 [`fetchival` 参见这里](https://github.com/typicode/fetchival)
```js
var posts = fetchival('/posts')
taskq.append(...); 
taskq.append(posts(1).put({ title: 'Fetchival is simple' })); //立即请求, 等请求返回后继续下一个任务
taskq.append(posts(1).put, null, [{ title: 'Fetchival is simple' }]); //第三个参数将作为 调用 posts(1).put 方法的参数列表
// 可以理解为 arguments[0].apply(arguments[1], arguments[2])
``` 

### 5. this作用域
```js
taskq.append(function(q){
    //this === document
}, document);
```

### 6. 统一异常处理
```js
//只能设置一个 onerror 处理函数
task.onerror = function(q, error){
    // error === Error("error test");
    // q.clear() 清空后续任务
    // q.suspend() 挂起任务
    // q.resume() 恢复任务执行
    // q.reset() 重置任务队列
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

### 7. 并行任务
```js
taskq.append(...); 
taskq.append([
    function(q){
        //任务1
    },
    function(q){
        q.async();
        api.get().then(q.next);
    },
    function(q){
        throw new Error(...);
    }
]); 
//上面3个任务同时开始, 等待执行成功, 并且异常处理完成后才继续下面的任务
taskq.append(...);
```

### 8. 新队列和全局队列
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
:---|:---|:---:
append()|追加任务|[查看](apidoc/append.md)
insert()|插入任务|[参考 append](apidoc/append.md)
running()|判断是队列否正在执行|`if(taskq.running()){...}`
count()|待执行任务数|`if(taskq.count() > 0){...}`
new()|返回新的taskq对象|`new_taskq = taskq.new()`
global()|返回全局taskq对象|`taskq = new_taskq.global()`
reset()|重置任务|[查看](apidoc/??.md)
clear()|清空任务|[查看](apidoc/??.md)
suspend()|挂起队列|[查看](apidoc/??.md)
resume()|恢复队列|[查看](apidoc/??.md)
onerror|异常处理函数|[查看](apidoc/??.md)
asyncq|返回调用了`async()`方法的`q`对象|`var q = taskq.asyncq()`

### 参数`q`
api | 说明 | 详细
:---|:---|:---:
taskq()|获取当前的taskq对象|`var tq = q.taskq()`
async()|声明当前方法为异步|[查看](apidoc/??.md)
next()|异步任务结束|[查看](apidoc/??.md)
append()|追加任务|等价于`q.taskq().append(...)`
insert()|插入任务|等价于`q.taskq().insert(...)`
