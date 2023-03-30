
var width = window.innerWidth;
var height = window.innerHeight;

var stage = new Konva.Stage({
    container: "bienvenue",

    width: width,
    height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

var triangle = new Konva.RegularPolygon({
    x: 750,
    y: 320,
    sides: 3,
    radius: 100,
    fill: "blue",
    stroke: "black",
    strokeWidth: 4,
});
layer.add(triangle);
var circle = new Konva.Circle({
    x: 1000,
    y: 300,
    radius: 100,
    fill: "blue",
    stroke: "black",
    strokeWidth: 4,
});
layer.add(circle);
console.log("ok")

