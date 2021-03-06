(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    function _is_checked(shape) {
        return shape.checked;
    }

    angular.module('Paint').factory('Paint_Manager',
        function (Paint_Manager_Grid, Paint_Manager_Shape, Paint_Manager_Polygon, Paint_Manager_Boxes, Paint_Manager_Leap, Color_Palette, Paint_Manager_Move) {

            function Paint_Manager(params) {
                this.scope = params.scope;
                this.scope.paint_manager = this;
                var canvas = $(params.ele).find('canvas.paint-canvas')[0];

                this.canvas = canvas;
                canvas.width = this.screen_width();
                canvas.height = this.screen_height();

                this.stage = new createjs.Stage(canvas);
                this.shapes = [];

                Paint_Manager_Grid(this);

                var self = this;

                this.make_frame();

                this.make_draw_container();

                Paint_Manager_Polygon(this);

                Paint_Manager_Boxes(this);

                Paint_Manager_Move(this);

                this.add_button_bindings();

                this.add_form_bindings();

                this.palette = Color_Palette(this, this.margin() * 2, this.margin() * 2,
                    this.screen_width() - (4 * this.margin()),
                    this.screen_height() - (4 * this.margin())
                );

                Paint_Manager_Leap(this);

                this.update();
            }

            Paint_Manager.prototype = {
                /* ********************** SCOPE BINDINGS *************** */
                export: function () {
                    var drawing = _.pluck(this, '_id');
                    drawing.shapes = _.map(this.shapes, function () {
                        return this.shapes.export()
                    }, this);

                    return drawing;
                },

                draw_button_class: function (class_name) {
                    var classes = [class_name];
                    if (this.active_button == class_name) classes.push('active');
                    return classes.join(' ');
                },

                add_button_bindings: function () {
                    this.scope.add_rectangle = this._shape_button_fn('rectangle');
                    this.scope.add_oval = this._shape_button_fn('oval');
                    this.scope.add_triangle = this._shape_button_fn('triangle');
                    this.scope.rotate = _.bind(this.rotate, this);
                    this.scope.clone = _.bind(this.clone, this);
                    this.scope.draw_button_class = _.bind(this.draw_button_class, this);
                    this.scope.remove_shape = _.bind(this.remove_shape, this);
                },

                remove_shape: function(){
                    if (!this.active_shape) return;

                    this.shapes = _.reject(this.shapes, function(shape){
                         return shape === this.active_shape;
                    }, this);
                    this.active_shape = null;
                    this.shapes_to_dc();
                },

                add_form_bindings: function () {
                    this.scope.set_current_color = _.bind(this.set_current_color, this);
                    this.scope.choose_color = _.bind(this.choose_color, this);
                    this.scope.group_checked = _.bind(this._group_checked, this);
                },

                _group_checked: function () {
                    var checked = _.filter(this.shapes, _is_checked);
                    this.shapes = _.reject(this.shapes, _is_checked);
                    this.active_shape = this.add_shape('group', checked);
                    this.active_shape.crop_group();
                    this.active_shape.draw();
                    this.shapes_to_dc();
                },

                choose_color: function () {
                    this.palette.show();
                },

                set_current_color: function (c) {
                    this._current_color = c;
                    if (this.active_shape) {
                        this.active_shape.set_color(c);
                        this.update();
                    }

                },

                make_draw_container: function () {
                    this.draw_container = this.add('container');
                    this.frame.addChild(this.draw_container);
                },

                activate: function (shape) {
                    this.active_shape = shape;
                },

                /**
                 * probably deprectatable - redundant with draw_container.
                 */
                make_frame: function () {
                    this.frame = this.add('container', true);
                },

                rotate: function () {
                    if (this.active_shape) {
                        this.active_shape.set_rotation(this.active_shape.get_rotation() + 45);
                        this.active_shape.draw();
                        this.update();
                    }
                },

                clone: function(){
                    if (this.active_shape) {
                       this.active_shape.clone();
                    }
                    this.shapes_to_dc();
                },

                add_shape: function (type, subs) {
                    var shape = Paint_Manager_Shape(this, type, subs);
                    this.active_shape = shape;
                    this.shapes.push(shape);
                    if (type != 'group') {
                        shape.set_color(this.scope.current_color);
                        this.shapes_to_dc();
                    }
                    return shape;
                },

                update: function (no_boxes) {
                    if (!no_boxes) {
                        _.each(this.boxes, function (box) {
                            box.update();
                        });
                    }
                    this.stage.update();
                },

                /* **************** PROPERTIES ********************* */

                grid_size: function () {
                    var pc = this.scope.paint_canvas;
                    if (!pc || !pc.grid) {
                        return DEFAULT_GRID_SIZE;
                    }
                    return Number(pc.grid);
                },

                margin: function () {
                    var pc = this.scope.paint_canvas;

                    if (!pc || !pc.margin) return DEFAULT_SCREEN_MARGIN;
                    return Number(pc.margin);
                },

                screen_width: function (inner) {
                    var pc = this.scope.paint_canvas;

                    if (inner) {
                        var width = this.screen_width();
                        width -= (2 * this.margin());
                        return width;
                    }

                    if (!pc || (!pc.width)) return DEFAULT_SCREEN_WIDTH;
                    return Number(pc.width);
                },

                screen_height: function (inner) {
                    var pc = this.scope.paint_canvas;

                    if (inner) {
                        var height = this.screen_height();
                        height -= (2 * this.margin());
                        return height;
                    }

                    if (!pc || (!pc.height)) return DEFAULT_SCREEN_HEIGHT;
                    return Number(pc.height);
                },

                /* ************* UTILITY ****************** */

                _shape_button_fn: function (type) {
                    return _.bind(function () {
                        this.add_shape(type);
                    }, this);
                },

                shapes_to_dc: function (no_update) {
                    this.draw_container.removeAllChildren();

                    _.each(this.shapes, function (shape) {
                        this.addChild(shape.container);
                    }, this.draw_container);
                    if (!no_update){
                        this.update();
                    }
                },

                snap: function (n, f) {
                    if (f) return n[f] = this.snap(n[f]);

                    return n - (n % this.grid_size());
                },

                add: function (item, indent) {
                    switch (item) {
                        case 'shape':
                            var shape = new createjs.Shape();
                            return this.add(shape);
                            break;

                        case 'container':
                            var container = new createjs.Container();
                            if (indent) {
                                container.x = container.y = this.margin();
                            }
                            return this.add(container);
                            break;

                        default:
                            this.stage.addChild(item);
                            return item;
                    }
                }

            };

            return function (scope, ele) {
                return new Paint_Manager({scope: scope, ele: ele});
            }

        })
})
    (window);