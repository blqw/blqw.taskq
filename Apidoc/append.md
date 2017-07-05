
## 1. 追加任务函数
```js
function append(function){};
```
```js
taskq.append(function(q) {
    //processes...
});
```

## 2. 追加任务函数, 并设置`this`作用域
```js
function append(function, object){};
```
```js
taskq.append(function(q) {
    this.xxx;
}, this);
```

## 3. 追加任务, 设置`this`作用域和参数  
以该方式调用, 默认参数`q`无效
```js
function append(function, object, [object, object, ..]){};
```
```js
taskq.append(function(window, $) {

}, this, [window, jQuery]);
```
该方式如果需要异步, 请参考:
```js
taskq.append(function(window, $) {
    var q = taskq.asyncq();
    setTimeout(function(){
        q.next();
    },1000)
    return q;
}, this, [window, jQuery]);
```

## 4. Promise/Fetch  

taskq并没有非常严格的判断 `Promise/Fetch` 对象  
只是判断对象是否存在`then`方法和`catch`方法(用于触发onerror)  
```js
function append(promise){};
```
```js
taskq.append(new Promise(function(resolve, reject) {
    resolve("Success!");
}));
taskq.append(function(window, $) {
    //processes...
}, this, [window, jQuery]);
```
并且会忽略then方法中的参数, 如果需要参数可以参考以下2种写法
```js
//1
var token = taskq.append(new Promise(function(resolve, reject) {
    resolve("Success!");
}));
taskq.append(function(q){
    if(token.todo){ //还没执行
        q.append(argument.callee);
    }else if(token.error){ //有错误
        console.log("有错误:" + token.error.message);
    }else if(token.completed){ //已完成
        var result = token.result; //得到返回值
    }
}), token);
//2
taskq.append(new Promise(function(resolve, reject) {
    resolve("Success!");
}).then(function(value) {
  console.log(value); // Success!
});
//3
taskq.append(function(q){
    q.async();
    new Promise(function(resolve, reject) {
        resolve("Success!");
    }).then(function(value) {
        console.log(value);
        q.next();
    }
});
```


## 5. 并行任务
```js
function append([function, function ,...], object, [object, object, ..]){};
```
```js
taskq.append(function(window, $) {

}, this, [window, jQuery]);
```
该方式如果需要异步, 请参考:
```js
taskq.append(function(window, $) {
    var q = taskq.asyncq();
    setTimeout(function(){
        q.next();
    },1000)
    return q;
}, this, [window, jQuery]);
```

## 6. 延迟任务

追加一个延迟 指定 毫秒的空任务
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