## append 方法完整签名
```js
taskq.append(function|promise|fetch|thenable|Array(function|promise|fetch|thenable)|number, Array(object|taskq)|object, then, catch) 
```

## 1. 添加任务函数
```js
function append(function)
```
```js
//同步任务
taskq.append(function(q) {
    //processes...
});
//异步任务
taskq.append(function(q) {
    q.async()
    setTimeout(function(){
        ...
        q.next();
    },1000);
});
```

## 2. 任务参数  
以该方式调用, 默认参数`q`无效
```js
function append(function, Array(object|taskq))
```
```js
//自定义列表
taskq.append(function(window, $) {

}, [window, jQuery]);
//参数q
taskq.append(function(window, $, q) {
    q.async();
    ...
    q.next();
}, [window, jQuery, taskq]);
```
*参数列表中包含 `taskq` 对象, 在执行方法时会被替换为参数`q`*

## 3. promise/fetch/thenable 任务
[promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise#%E7%A4%BA%E4%BE%8B), 
[fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch#%E8%BF%9B%E8%A1%8C_fetch_%E8%AF%B7%E6%B1%82), 
[thenable](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)
```js
function append(promise|fetch|thenable)
```
```js
//promise
taskq.append(new Promise(function(resolve, reject) { 
    resolve("Success!");
}));
//promise 扩展
taskq.append(function(resolve, reject) {
    resolve("Success!");
}.promise());
//fetch
taskq.append(fetch('flowers.jpg').then(result){ ... });
//fetch + 参数 = 延迟执行
taskq.append(fetch, ['flowers.jpg']);

//thenable
taskq.append({
    then : function(resolve, reject) {
        resolve("Success!");
    }
});
//thenable 扩展
taskq.append(function(resolve, reject) {
    resolve("Success!");
}.thenable());
```

## 4. 单任务的then和catch
```js
function append(function|promise|fetch|thenable, Array(object|taskq), then, catch)
```
```js
function append(function(q){
    return "Success";
    // or throw new Error("Fail");
}, null, function(result){
    // result === 'Success'
}, function (e){
    // Fail
});
// 异步
function append(function(q){
    q.async();
    setTimeout(function(){
        q.next("Success");
    }, 1000);
}, null, function(result){
    // result === 'Success'
}, function (e){
    // Error
});
```

## 5. 并行任务
```js
function append([function, function ,...], array)
```
```js
//无参数
taskq.append([
    function(q) { },
    function(q) { },
    function(q) { }
]);
//共享参数
taskq.append([
    function(window, $) { },
    function(window, $) { },
    function(window, $) { }
], [window, jQuery]);
//独立参数
taskq.append([
    function fun1(window) { },
    function fun2($) { },
    function fun3(window, $) { }
], {
    fun1:[window],
    fun2:[jQuery],
    fun3:[window, jQuery],
});
```
*如果你愿意, 你也可以定义多个同名方法来使用相同的参数列表*

## 
```js
function append(function (q){
    setTimeout(function(q){
        q.next();
    }, 1000);
    return function(q){
        
    }
})
```


## 6. 延迟任务

追加一个延迟指定**毫秒**的空任务
```js
function append(number){};
```
```js
taskq.append(1000);
```
等价于
```js
taskq.append(function(q){
    q.async();
    setTimeout(function(){
        q.next();
    }, this);
}, 1000);
```
