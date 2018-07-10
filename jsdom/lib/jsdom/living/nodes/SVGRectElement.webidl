// https://svgwg.org/svg2-draft/shapes.html#InterfaceSVGRectElement

interface SVGRectElement : SVGGeometryElement {
  [SameObject] readonly attribute SVGAnimatedLength x;
  [SameObject] readonly attribute SVGAnimatedLength y;
  [SameObject] readonly attribute SVGAnimatedLength width;
  [SameObject] readonly attribute SVGAnimatedLength height;
  [SameObject] readonly attribute SVGAnimatedLength rx;
  [SameObject] readonly attribute SVGAnimatedLength ry;

  Object getPathData();
};