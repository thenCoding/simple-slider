/**
 * Created by thenCoding on 2016/10/8.
 */
(function ($) {

    /**
     * 轮播器的默认配置
     * @type {{delay: number, speed: number, style: string, complete: function, timer: null, current_frame: number}}
     */
    var config_default = {
        delay: 3500,               //每次间隔
        speed: 500,                 //过渡时间
        style: 'slide',             //轮播风格
        complete: null,             //每一帧完成之后的回调
        timer: null,                //定时器
        current_frame: 1,           //当前帧
        visibleCount: 5,            //风格为surround时可见的图片数量
        scale: 0.8                  //风格为surround时图片宽度的缩放比例
    };


    /**
     * 轮播器构造函数
     * @constructor
     * @param id {string} required
     * @param config {object}
     */
    function Slider(id, config) {

        if (id && typeof id == 'string') {

            //获取当前轮播器的最外层dom元素
            this.domElement = $('#' + id.replace(/^#|\./, ''));

            //获取当前轮播器的帧数
            this.frames = this.domElement.find('.slider-item').length;

        } else {

            console.error('the first argument of Slider is required and should be string! ');

            return
        }

        if (!this.domElement.get(0)) {

            console.error('can not find domElement by selector ' + id);

            return
        }

        if (config && isNaN(config)) {

            this.style = config.style || 'slide';
            this.delay = config.delay || config_default.delay;
            this.speed = config.speed || config_default.speed;
            this.complete = config.complete || null;
            config.style == 'surround' && (this.visibleCount = config.visibleCount || config_default.visibleCount);
            config.style == 'surround' && (this.scale = config.scale || config_default.scale);

        }

        this.current_frame = config_default.current_frame;
        this.timer = config_default.timer;
        this.ready = false;
        this.baseDomItem = document.getElementsByClassName('slider-item')[(this.visibleCount + 1) / 2];

        this.leftOffsetArr = [];
        this.topOffsetArr = [];
        this.zIndexArr = [];
        this.widthArr = [];
        this.sliderDomArr = [];
        var self = this;
        $('.slider-item').each(function () {
            self.sliderDomArr.push(this);
        });

        //初始化轮播组件的CSS样式
        initCss(this);
    }

    /**
     * 轮播器开启
     */
    Slider.prototype.play = function () {

        var self = this;

        //开始轮播
        autoplay(self);
    };

    /**
     * 暂停轮播
     */
    Slider.prototype.pause = function () {

        clearInterval(this.timer);

    };

    /**
     * 暂停后继续轮播
     */
    Slider.prototype.continue = function () {

        autoplay(this);

    };

    /**
     * 展示轮播器的某一帧
     * @param index
     */
    Slider.prototype.go = function (index) {

        clearInterval(this.timer);

        if (this.style == 'slide') {

            keyframe_slide(index || 0, this);

        } else {

            keyframe_fade(index || 0, this);

        }

        this.current_frame = index + 1;

        autoplay(this);

    };

    /**
     * 初始化CSS样式
     * @param context required
     */
    function initCss(context) {

        var banner = context.domElement;

        var slider = context.domElement.find('.slider');

        var slider_item = context.domElement.find('.slider-item');

        switch (context.style) {

            case 'fade' :

                initCss_fade(banner, slider, slider_item);

                break;

            case 'slide' :

                initCss_slide(banner, slider, slider_item);

                break;

            case 'surround':

                initCss_surround(banner, slider, slider_item, context);

                break;

            default:

                initCss_slide(banner, slider, slider_item);

                break;

        }
    }

    /**
     * 配置为fade风格的轮播初始化样式
     * @param banner required
     * @param slider required
     * @param slider_item required
     */
    function initCss_fade(banner, slider, slider_item) {

        banner.css({
            'position': 'relative',
            'overflow': 'auto'
        });

        slider.css({
            width: '100%'
        });

        slider_item.css({
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 1,
            'width': '100%'
        });

        slider_item.eq(0).css({
            'z-index': 3
        });
    }

    /**
     * 配置为slide风格的初始化样式
     * @param banner required
     * @param slider required
     * @param slider_item required
     */
    function initCss_slide(banner, slider, slider_item) {

        banner.css({
            'overflow': 'hidden',
            'width': '100%'
        });

        slider_item.css({
            'float': 'left',
            'width': 100 / slider_item.length + '%'
        });

        slider.eq(0).css({
            'width': slider_item.length * 100 + '%',
            'margin-left': 0,
            'overflow': 'hidden'
        })
    }

    /**
     * 配置为surround风格的初始化样式
     * @param banner required
     * @param slider required
     * @param slider_item required
     * @param context required
     */
    function initCss_surround(banner, slider, slider_item, context) {

        context.width_wrapper = parseFloat(context.domElement.css('width'));
        context.item = slider_item;
        banner.css({
            'position': 'relative',
            'overflow': 'hidden'
        });

        slider.eq(0).css({
            'width': slider_item.length * 100 + '%',
            'margin-left': 0,
            'overflow': 'hidden'
        });

        slider_item.css({
            'position': 'absolute'
        });
        if (context.visibleCount % 2 == 0) {
            context.visibleCount++;
        }

        var maxIndex = (context.visibleCount + 1) / 2;

        context.baseDomItem.onload = function () {
            context.ready = true;
            context.baseWidth = parseFloat(slider_item.eq(maxIndex - 1).css('width'));
            context.baseHeight = parseFloat(slider_item.eq(maxIndex - 1).css('height'));
            context.maxIndex = (context.visibleCount + 1) / 2;

            for (var i = 0; i < context.visibleCount; i++) {

                slider_item.eq(i).css({
                    'z-index': setZIndex(i, context),
                    'width': setWidth(i, context),
                    'top': setTop(i, context)
                });

                slider_item.eq(i).css({
                    'left': setLeft(i, context)
                })
            }

        };

    }

    /**
     * 计算索引为index的元素的left属性
     * @param index
     * @param context
     */
    function setLeft(index, context) {

        var leftOffset;

        if (index + 1 === context.maxIndex) {

            leftOffset = (context.width_wrapper - context.baseWidth) / 2;

            context.leftOffsetArr[index] = leftOffset;

            return leftOffset + 'px';

        } else if (index + 1 < context.maxIndex) {

            leftOffset = (0.5 * context.width_wrapper) - getLeftOffset(index, context);

            context.leftOffsetArr[index] = leftOffset;

            return leftOffset + 'px'

        } else if (index + 1 > context.maxIndex) {

            leftOffset = (0.5 * context.width_wrapper) + getLeftOffset(index, context) - parseFloat(context.item.eq(index).css('width'));

            context.leftOffsetArr[index] = leftOffset;

            return leftOffset + 'px';

        }
    }

    /**
     * 计算索引为index的元素相对于中线的偏移量
     * @param index
     * @param context
     * @returns {number}
     */
    function getLeftOffset(index, context) {

        var offset = context.baseWidth / 2;

        var multiple = context.scale;

        var len = Math.abs(index + 1 - context.maxIndex);

        if (index + 1 != context.maxIndex) {
            for (var n = 0; n < len; n++) {
                offset += Math.pow(multiple, n + 1) * context.baseWidth / 2;
            }
        }

        return offset;
    }

    /**
     * 计算索引为index的元素的top属性
     * @param index
     * @param context
     */
    function setTop(index, context) {

        var topOffset;

        if (index + 1 === context.maxIndex) {

            context.topOffsetArr[index] = 50;

            return '50px';

        } else {

            topOffset = getTopOffset(index, context);

            context.topOffsetArr[index] = topOffset;

            return topOffset + 'px'

        }
    }

    /**
     * 计算索引为index的元素相对于容器顶部的偏移量
     * @param index
     * @param context
     * @returns {number}
     */
    function getTopOffset(index, context) {

        var offset = 50;

        var multiple = context.scale;

        var len = Math.abs(index + 1 - context.maxIndex);

        if (index + 1 != context.maxIndex) {
            for (var n = 0; n < len; n++) {
                offset += Math.pow(multiple, n) * context.baseHeight * (1 - multiple) / 2;
            }
        }

        return offset;
    }

    /**
     * 计算索引为index的元素的width属性
     * @param index
     * @param context
     */
    function setWidth(index, context) {

        var width = context.baseWidth * Math.pow(context.scale, Math.abs(index + 1 - context.maxIndex));

        context.widthArr.push(width);

        return width + 'px';

    }

    /**
     * 设置索引为index的元素z-index属性
     * @param context
     * @param index
     */
    function setZIndex(index, context) {

        if (index + 1 == context.maxIndex) {

            context.zIndexArr[index] = context.maxIndex;

            return context.maxIndex;

        } else {

            var _index = context.maxIndex - Math.abs(index + 1 - context.maxIndex);

            context.zIndexArr[index] = _index;

            return _index

        }
    }

    /**
     * 自动轮播函数
     * @param context
     */
    function autoplay(context) {

        switch (context.style) {

            case 'fade':

                context.timer = timer(keyframe_fade, context);

                break;

            case 'slide':

                context.timer = timer(keyframe_slide, context);

                break;

            case 'surround':

                context.timer = timer(keyframe_surround, context);

                break;

            default:

                context.timer = timer(keyframe_slide, context);

                break;
        }
    }

    /**
     * 计时器
     * @param context
     * @param fn
     */
    function timer(fn, context) {

        return setInterval(function () {

            fn(context.current_frame, context);

            context.current_frame++;

            context.current_frame >= context.frames && (context.current_frame = 0);

        }, context.delay);

    }

    /**
     * 配置风格为slide时每一次轮播的帧样式
     * @param index {number}
     * @param context
     */
    function keyframe_slide(index, context) {

        context.current_frame = index;

        context.domElement.find('.slider').eq(0).animate({
            'margin-left': -100 * index + '%'
        }, context.speed);

        if (context.complete && context.complete instanceof Function) {

            setTimeout(function () {

                context.complete(index);

            }, context.speed);
        }
    }

    /**
     * 配置风格为fade时每一次轮播的帧样式
     * @param index
     * @param context
     */
    function keyframe_fade(index, context) {

        context.current_frame = index;

        context.domElement.find('.slider-item').animate({
            'opacity': 0
        }, context.speed).eq(index).animate({
            'opacity': 1
        }, context.speed);

        if (context.complete && context.complete instanceof Function) {

            setTimeout(function () {

                context.complete(index);

            }, context.speed);
        }
    }

    /**
     * 配置风格为surround时每一次轮播的帧样式
     * @param index
     * @param context
     */
    function keyframe_surround(index, context) {

        context.current_frame = index;

        var chunk = context.sliderDomArr.shift();

        context.sliderDomArr = context.sliderDomArr.concat(chunk);

        context.sliderDomArr.forEach(function (item, i) {

            $(context.sliderDomArr[i]).animate({

                'left': context.leftOffsetArr[i],

                'top': context.topOffsetArr[i],

                'width': context.widthArr[i],

                'z-index': context.zIndexArr[i]

            },context.speed);

        });

        if (context.complete && context.complete instanceof Function) {

            setTimeout(function () {

                context.complete(index);

            }, context.speed);
        }
    }

    window.Slider = Slider;

})(jQuery);
