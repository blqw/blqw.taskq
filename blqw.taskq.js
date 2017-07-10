(function (window, name) {

    if ("promise" in Function.prototype === false) {
        Function.prototype.promise = function () {
            return new Promise(this);
        }
    }
    if ("thenable" in Function.prototype === false) {
        Function.prototype.thenable = function () {
            return { then: this };
        }
    }
    /*
     fucntion (next){

     }
     */
    // 服务组件
    var _services = {
        factory: {}
    };

    var _taskq;
    function TaskQ() {
        var quque;
        var running = false;
        var next;
        this.reset = function () {
            this.status = "idle"
            quque = [];
            next = function () {
                if (quque === this) {
                    running = false;
                    setTimeout(run, 1);
                }
            }.bind(quque);
        };
        this.reset(); //初始化
        this.suspend = function () {
            this.status = "suspend";
            quque.suspend = true;
        };
        this.resume = function () {
            quque.suspend = false;
            setTimeout(run, 1);
        };

        function ArgQ(q) {
            if (typeof q === "function") {
                var async = [];
                this.async = function () {
                    async.push(this);
                }
                this.next = function () {
                    var index = async.indexOf(this);
                    if (index > -1) {
                        async.splice(index, 1);
                        if (async.length == 0) {
                            q();
                        }
                    }
                }
            } else {
                this.async = q.async;
                this.next = q.next;
            }
        }
        //替换参数中的 q
        ArgQ.replace = function (argq, array) {
            if (Array.isArray(array)) {
                for (var i = 0; i < args.length; i++) {
                    if (array[i] instanceof TaskQ) {
                        array[i] = new ArgQ(argq);
                    }
                }
            }
        };
        ArgQ.allnext = function (args) {
            for (var a in args) {
                for (var b in args[a]) {
                    if (args[a][b] instanceof ArgQ) {
                        args[a][b].next();
                    }
                }
            }
        }
        var run = function () {
            if (quque.suspend) {
                return;
            }
            this.status = "idle"
            if (running) {
                return;
            }
            running = true;
            var task = quque.shift();
            if (task == null) {
                running = false;
                return;
            }
            this.status = "running"
            var q = new ArgQ(next);
            q.async();
            var args = task.args;
            if (args && Array.isArray(args)) {
                ArgQ.replace(q, args);
            } else if (typeof args === "object") {
                for (var key in args) {
                    ArgQ.replace(q, args[key]);
                }
            } else {
                args = [new ArgQ(q)];
            }

            task.catch = function (error) {
                try {
                    if (typeof task.fail === "function") {
                        task.fail(error);
                    } else {
                        this.onerror(error);
                    }
                } catch (e) {
                    this.onerror(e);
                } finally {
                    q.next();
                    ArgQ.allnext(args);
                }
            }.bind(this);
            task.then = function (result) {
                if (typeof task.success === "function") {
                    var thenable = task.success(result);
                    if (thenable && typeof thenable.then === "function") {
                        thenable.then(next.bind(q));
                        return;
                    }
                }
                q.next();
            }.bind(this);

            task.exec.apply(this, args).then(task.then).catch(task.catch);

        }.bind(this);

        this.append = function (tasks, args, success, fail) {
            if (tasks == null) {
                return;
            }
            var exec = _services.factory[tasks.constructor.name](tasks);
            quque.push({ id: Math.random(), exec: exec, args: args, success, fail });
            setTimeout(run, 1);
        };
        this.new = function () { return new TaskQ(); };
        this.global = function () { return _taskq; };
        this.clear = function () { quque.length = 0; };
        this.onerror = function (error) { throw error; };
        this.status = "idle";// "running", "suspend"
        this.registerTask = function (type, factory) {
            _services.factory[type] = factory;
        }
    }

    _taskq = new TaskQ();
    _taskq.registerTask(Function.name, function (func) {
        return function (args) {
            try {
                var any = func(args);
                if (any && typeof any.then === "function" && typeof any.catch === "function") {
                    return any;
                }
                return Promise.resolve(any);
            } catch (error) {
                return Promise.reject(error);
            }
        };
    });

    if (typeof window.define === 'function' && window.define.amd) {
        window.define(function () { return _taskq; });
    } else {
        window[name] = _taskq;
    }
})(window, "taskq");