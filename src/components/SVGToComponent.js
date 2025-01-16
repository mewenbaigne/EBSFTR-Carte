import React from 'react';
import {
  Svg,
  Line,
  Polyline,
  Polygon,
  Path,
  Rect,
  Circle,
  Ellipse,
  Text,
  Tspan,
  G,
  Stop,
  Defs,
  ClipPath,
  LinearGradient,
  RadialGradient,
} from '@react-pdf/renderer';
import { parse as svgparse } from 'svg-parser';

export const SVGToComponent = (svgString) => {
  const svgWithoutPixel = svgString.replaceAll('px', 'pt');
  const parsedSVG = svgparse(svgWithoutPixel);

  // Convertir une chaîne de styles CSS en objet React
  const convertStylesStringToObject = (stringStyles) => {
    if (typeof stringStyles !== 'string' || !stringStyles) return {};
    return stringStyles.split(';').reduce((acc, style) => {
      const [property, value] = style.split(':');
      if (property && value) {
        const formattedProperty = property.trim().replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        acc[formattedProperty] = value.trim();
      }
      return acc;
    }, {});
  };

  // Générer un composant JSX React pour chaque noeud SVG
  const svgToJsx = (node, index) => {
    const { type, tagName, properties, children } = node;

    let Component;
    switch (tagName || type) {
      case 'svg':
        Component = Svg;
        break;
      case 'line':
        Component = Line;
        break;
      case 'polyline':
        Component = Polyline;
        break;
      case 'polygon':
        Component = Polygon;
        break;
      case 'path':
        Component = Path;
        break;
      case 'rect':
        Component = Rect;
        break;
      case 'circle':
        Component = Circle;
        break;
      case 'ellipse':
        Component = Ellipse;
        break;
      case 'text':
        Component = Text;
        break;
      case 'tspan':
        Component = Tspan;
        break;
      case 'g':
        Component = G;
        break;
      case 'stop':
        Component = Stop;
        break;
      case 'defs':
        Component = Defs;
        break;
      case 'clipPath':
        Component = ClipPath;
        break;
      case 'linearGradient':
        Component = LinearGradient;
        break;
      case 'radialGradient':
        Component = RadialGradient;
        break;
      default:
        return null; // Si le type ou le tagName n'est pas pris en charge, on ignore
    }

    // Convertir les propriétés du noeud
    const props = {
      key: index,
      ...properties,
      style: properties?.style ? convertStylesStringToObject(properties.style) : undefined,
    };

    // Récursion sur les enfants
    const childElements =
      children && children.length > 0
        ? children.map((child, childIndex) => svgToJsx(child, `${index}-${childIndex}`))
        : null;

    return <Component {...props}>{childElements}</Component>;
  };

  // Convertir le premier enfant racine du SVG
  if (!parsedSVG.children || parsedSVG.children.length === 0) {
    console.warn('Le SVG ne contient aucun enfant');
    return null;
  }

  return <>{parsedSVG.children.map((child, index) => svgToJsx(child, index))}</>;
};