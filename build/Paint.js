(function(){

    angular.module('Paint', []);

})(window);;(function () {

    function Paint_Shape(params) {
        _.extend(this, params)
    }

    _.extend(Paint_Shape.prototype, {
    });

    var Paint = angular.module('Paint');

    Paint.factory('Paint_Shape', function (Color_Palette, Things) {

    });

}) (window);
;(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    angular.module('Paint').factory('Paint_Manager_Grid', function () {

        return function () {
            console.log('making grid');

            var width= this.screen_width(true);
            var height = this.screen_height(true);
            var grid_size = this.grid_size();

            console.log('width: ', width, 'heght:', height, 'grid_size:', grid_size);
            var grid_shape = new createjs.Shape();
            grid_shape.x = grid_shape.y = this.margin();
            var g = grid_shape.graphics.s(GRID_COLOR).ss(1);

            for (var x = 0; x <= width; x += grid_size){
                g.mt(x, 0).lt(x, height);
            }

            for (var y = 0; y <= height; y += grid_size){
                g.mt(0,y).lt(width, y);
            }

            g.es();

            this.stage.addChild(grid_shape);
            this.stage.update();

        }

    })
})(window);;(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    angular.module('Paint').factory('Paint_Manager', function (Paint_Manager_Grid) {

        function Paint_Manager(params) {
            this.scope = params.scope;
            var canvas = $(params.ele).find('canvas.paint-canvas')[0];

            this.canvas = canvas;
            canvas.width = this.screen_width();
            canvas.height = this.screen_height();

            this.stage = new createjs.Stage(canvas);
            console.log('new paint manager created');

            this.make_grid();
        }

        Paint_Manager.prototype = {

            make_grid: Paint_Manager_Grid,

            grid_size: function(){
                var pc = this.scope.paint_canvas;
                if (!pc || !pc.grid){
                    return DEFAULT_GRID_SIZE;
                }
                return Number(pc.grid);
            },

            margin: function(){
                var pc = this.scope.paint_canvas;

                if (!pc || !pc.margin) return DEFAULT_SCREEN_MARGIN;
                return Number(pc.margin);
            },

            screen_width: function(inner){
                var pc = this.scope.paint_canvas;

                if (inner){
                    var width = this.screen_width();
                   width -= (2* this.margin());
                    return width;
                }

                if (!pc || (!pc.width)) return DEFAULT_SCREEN_WIDTH;
                return Number(pc.width);
            },

            screen_height: function(inner){
                var pc = this.scope.paint_canvas;

                if (inner){
                    var height = this.screen_height();
                    height -= (2* this.margin());
                    return height;
                }

                if (!pc || (!pc.height)) return DEFAULT_SCREEN_HEIGHT;
                return Number(pc.height);
            }

        };

        return function (scope, ele) {
            return new Paint_Manager({scope: scope, ele: ele});
        }

    })
})(window);;(function () {

    var paint = angular.module('Paint');

    paint.directive('paintEditor', function InjectingFunction(Paint_Manager) {
        //@TODO: inject template root.
        return {
            templateUrl: '/js/paint/directives/editor.html',
            compile: function CompilingFunction($templateElement, $templateAttributes) {

                return function LinkingFunction($scope, $linkElement, $linkAttributes) {
                    console.log('attrs: ', $linkAttributes);
                    var width = Number($linkAttributes.width || 400);
                    var height = Number($linkAttributes.height || 300);
                    var grid = Number($linkAttributes.grid || 30);
                    var margin = Number($linkAttributes.margin || 50);
                    $scope.paint_canvas = {width: width, height: height, grid: grid, margin: margin};

                    $scope.paint_manager = Paint_Manager($scope, $linkElement);

                };
            }
        };
    });

})(window);