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
        builder: {},
        getBuilder: function (type) {
            var builder = _services.builder[type.name];
            if (builder == null) {
                throw new Error("无法使用 " + type.name + "对象 作为任务, 缺少编译器");
            }
            return builder;
        },
        registerBuilder: function (type, builder) {
            _services.builder[type.name] = builder;
        }
    };

    function ArgQ(q) {
        if (typeof q === "function") {
            var async = [];
            this.async = function () {
                async.push(this);
            };
            this.resolve = function () {
                var index = async.indexOf(this);
                if (index > -1) {
                    async.splice(index, 1);
                    if (async.length == 0) {
                        q();
                    }
                }
            };
            this.reject = function (error) {
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error(error);
                }
            }
        } else {
            this.async = q.async;
            this.resolve = q.resolve;
            this.reject = q.reject;
        }
        this.next = this.resolve;
        this.error = this.reject;
        var ctq ;
        this.append = function (tasks, args, success, fail) {
            if(ctq == null){
                ctq = new TaskQ();
            }
            ctq.append(tasks, args, success, fail);
        }
    }
    //替换参数中的 q
    ArgQ.replace = function (argq, array) {
        if (Array.isArray(array)) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] instanceof TaskQ) {
                    array[i] = new ArgQ(argq);
                }
            }
            return array;
        }
        return [new ArgQ(argq)];
    };
    ArgQ.allnext = function (args) {
        for (var a in args) {
            var x = args[a];
            if (x instanceof ArgQ) {
                x.next();
            } else for (var b in x) {
                if (x[b] instanceof ArgQ) {
                    x[b].next();
                }
            }
        }
    }

    var _taskq;
    function TaskQ() {
        var quque, running, next;
        this.reset = function () {
            this.status = "idle"
            quque = [];
            running = false;
            next = function () {
                if (quque === this) {
                    running = false;
                    setTimeout(run, 1);
                }
            }.bind(quque);
        }.bind(this);
        this.reset(); //初始化
        this.suspend = function () {
            this.status = "suspend";
            quque.suspend = true;
        }.bind(this);
        this.resume = function () {
            quque.suspend = false;
            setTimeout(run, 1);
        }.bind(this);

        var run = function () {
            if (quque.suspend) {
                return;
            }
            this.status = "idle"
            if (running) {
                return;
            }
            var task = quque.shift();
            if (task == null) {
                running = false;
                return;
            }
            running = true;
            this.status = "running"
            var q = new ArgQ(next);
            q.async();
            var args = task.args;
            if (args && Array.isArray(args)) {
                args = ArgQ.replace(q, args);
            } else if (args && typeof args === "object") {
                for (var key in args) {
                    args[key] = ArgQ.replace(q, args[key]);
                }
                args[""] = [new ArgQ(q)];
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

            task.exec(this, args).then(task.then).catch(task.catch);

        }.bind(this);

        this.append = function (tasks, args, success, fail) {
            if (tasks == null) {
                return;
            }
            var builder = _services.getBuilder(tasks.constructor);
            var func = builder(tasks);
            quque.push({ id: Math.random(), exec: func, args: args, success, fail });
            setTimeout(run, 1);
        };
        this.new = function () { return new TaskQ(); };
        this.global = function () { return _taskq; };
        this.clear = function () { quque.length = 0; }.bind(this);
        this.onerror = function (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(error);
            }
        };
        this.status = "idle";// "running", "suspend"
        this.registerBuilder = _services.registerBuilder.bind(_services);
    }

    _taskq = new TaskQ();
    _taskq.registerBuilder(Function, function (func) {
        return function (thisValue, args) {
            return new Promise(function (resolve, reject) {
                for (var i = 0; i < args.length; i++) {
                    if (args[i] instanceof ArgQ) {
                        var q = args[i];
                        q.async = function () {
                            async = true;
                            this.next = this.resolve = resolve;
                            this.error = this.reject = reject;
                            resolve = null;
                        }
                        break;
                    }
                }
                var any = func.apply(fetch === func ? undefined : thisValue, args);
                resolve && resolve(any);
            });
        };
    });

    _taskq.registerBuilder(Promise, function (promise) {
        return function () { return promise; };
    });

    _taskq.registerBuilder(Object, function (thenable) {
        return function () { return Promise.resolve(thenable); };
    });

    _taskq.registerBuilder(Number, function (number) {
        return function () {
            return new Promise(function (resolve, reject) {
                setTimeout(resolve, number);
            });
        };
    });

    _taskq.version = "1.0.0";

    if (typeof window.define === 'function' && window.define.amd) {
        window.define(function () { return _taskq; });
    } else {
        window[name] = _taskq;
    }
})(window, "taskq");