graph.js
========

Basic plotting from javascript in 2d canvas. Provides a JS API, but also provides a simple way to add graphs in static content as well. i.e. Drawing a simple sin plot. Supports basic cartesian and polar plots, drawing lines, vectors, points, bars, and animating views as well. Some CSS styling properties are avialable.

<graph>
	<function>y=Math.sin(x)</function>
</graph>

You can see things in action at:
http://dl.dropboxusercontent.com/u/72157/Physics/Intro.html

Mostly a result of my playing. Goal is to create something thats highly styleable and customizable. Make embedding a graph into a web page easy. Increase math literacy :)

TODO
===================
Build scripts to build a single file
  Customizable to remove node types that aren't needed
3D plotting
Dynamically update plots on mutation of the nodes
Update graphs on style changes
Better JS API
Labels and Legends
Improve animation performance
Tracing along graphs/points
Touch support
Remove animation nodes? Can we make any property take variables with time in them? i.e. width="5*Math.cos(t)". How would that work with colors?
Pie charts
Alternative bar graphs

ISSUES
===================
Lots :)

