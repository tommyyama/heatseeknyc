$(document).ready(function(){
  // todos for this file
  // make it OO
  drawChartAjaxCall();
});

function draw(response) {
      // Chart size
  var w = window.innerWidth,
      h = 450,
      // Date variables
      days = [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
      monthNames = [ "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER" ],
      abbreviatedMonthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
      // d3 variables
      maxDataPointsForDots = 500,
      transitionDuration = 1000,
      svg = null,
      yAxisGroup = null,
      xAxisGroup = null,
      dataCirclesGroup = null,
      dataLinesGroup = null;

  if(/live_update/.test(document.URL)){
    transitionDuration = 0;
  }

  var data = response,
  violations = 0;
  // add usefull properties to the data objects
  data.forEach(function(obj){
    obj.date = new Date(obj.created_at);
    obj.isDay = obj.date.getHours() >= 6 && obj.date.getHours() <= 22;
    if(obj.violation){ violations += 1; }
  });
  var margin = 40;
  var max = d3.max(data, function(d) { return d.temp }) + 1;
  // checks whether or not there is an outdoor temp
  if ( d3.min(data, function(d) { return d.outdoor_temp }) ){
    var min = d3.min(data, function(d) { return d.outdoor_temp }) - 5;
  } else {
    var min = d3.min(data, function(d) { return d.temp }) - 10;
  }
  var pointRadius = 4;
  var x = d3.time.scale().range([0, w - margin * 2]).domain([data[0].date, data[data.length - 1].date]);
  var y = d3.scale.linear().range([h - margin * 2, 0]).domain([min, max]);
  var xAxis = d3.svg.axis().scale(x).tickSize(h - margin * 2).tickPadding(0).ticks(data.length);
  var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-w + margin * 2).tickPadding(0).ticks(7);
  var t = null,
  strokeWidth = w / data.length;

  svg = d3.select('#d3-chart')
      .append('svg:svg')
      .attr('width', w)
      .attr('height', h)
      .attr('id', 'main-svg')
      .attr('transform', 'translate(' + margin + ',' + margin + ')');
      // .append('svg:g')

  // t = svg.transition().duration(transitionDuration);

  function addLineStlyingToXTicks(){
    var $lines = $(".xTick .tick line"),
        length = data.length,
        date,
        newText,
        $textEl;

    for( var i = 0; i < length; i++ ){
      if(data[i].isDay === false){
        $($lines[i]).attr(
          { 'stroke-width': strokeWidth, 'stroke': '#90ABB0' }
        );
        if(i === 0){
          $($lines[i]).attr({ 'stroke-width': strokeWidth * 1.9 });
        }
      }
      else {
        // add dates to bottom of graph
        if ( data[i].date.getHours() === 16 ) {
          date = data[i].date;
          newText = abbreviatedMonthNames[date.getMonth()] + " " 
            + date.getDate() + ", " + (date.getYear() + 1900);
          $textEl = $($(".xTick .tick text")[i]);
          $textEl.text(newText);
          $textEl.show();
          $textEl.attr({"x": -15, "y": 380});
        }
      }
    }
  }

// x ticks and labels gets placed first
  // x ticks and labels
  if (!xAxisGroup) {
    xAxisGroup = svg.append('svg:g')
      .attr('class', 'xTick')
      .call(xAxis);
    addLineStlyingToXTicks();
  }
  else {
    t.select('.xTick').call(xAxis);
  }

// y ticks and labels gets placed second
  // y ticks and labels
  if (!yAxisGroup) {
    yAxisGroup = svg.append('svg:svg')
      .attr('class', 'yTick')
      .call(yAxis);
  }
  else {
    t.select('.yTick').call(yAxis);
  }
  // fixes x value for text
  $(".yTick .tick text").attr("x", "-5")

// y ticks and labels gets placed third
  // Draw the lines
  if (!dataLinesGroup) {
    dataLinesGroup = svg.append('svg:g');
  }

  var dataLines = dataLinesGroup.selectAll('.data-line').data([data]);

  var line = d3.svg.line()
    .x(function(d,i) {
      return x(d.date); 
    })
    .y(function(d) {
      return y(d.temp); 
    })
    .interpolate("linear");

  var garea = d3.svg.area()
    .interpolate("linear")
    .x(function(d) { 
      return x(d.date); 
    })
    .y0(h - margin * 2)
    .y1(function(d) { 
      return y(d.outdoor_temp); 
    });

  dataLines
    .enter()
    .append('svg:path')
    .attr("class", "area");
    // .attr("d", garea(data));

  dataLines.enter().append('path')
    .attr('class', 'data-line')
    // comment back in for low to high opacity transitions
    // .style('opacity', 0.3)
    .attr("d", line(data))
    // .transition()
    // .delay(transitionDuration / 2)
    // .duration(transitionDuration)
    .style('opacity', 1);
    
  // comment back in for slide up transition 
  // dataLines.transition()
  //   .attr("d", line)
  //   .duration(transitionDuration)
  //   .style('opacity', 1)
  //   .attr("transform", function(d) {
  //     return "translate(" + x(d.date) + "," + y(d.temp) + ")"; 
  //   });

  dataLines.exit()
    .transition()
    .attr("d", line)
    .duration(transitionDuration)
    .attr("transform", function(d) {
     return "translate(" + x(d.date) + "," + y(0) + ")"; 
    })
    .style('opacity', 1e-6)
    .remove();

  d3.selectAll(".area")
  //   .transition()
  //   .duration(transitionDuration)
    .attr("d", garea(data));

  // move the area to the back of the graph
  var $garea = $(".area").last();
  $("#main-svg").prepend($garea);


  // add number of violations to the legend
  $("#violations span").text($("#violations span")
    .text().replace(/\d+/, violations));


  if (violations) {
  // Draw the circles if there are any violations
    if (!dataCirclesGroup) {
      dataCirclesGroup = svg.append('svg:g');
    }

    var circles = dataCirclesGroup.selectAll('.data-point').data(data);

    circles.enter()
      .append('svg:circle')
      .attr('class', 'data-point')
      .style('opacity', 1)
      .attr('cx', function(d) { return x(d.date) })
      .attr('cy', function() { return y(0) })
      .attr('r', function(d) {
        return d.violation ? pointRadius : 0;
      })
      .transition()
      .duration(transitionDuration)
      .style('opacity', 1)
      .attr('cx', function(d) { return x(d.date) })
      .attr('cy', function(d) { return y(d.temp) });

    // circles
    //   .transition()
    //   .duration(transitionDuration)
    //   .attr('cx', function(d) { return x(d.date) })
    //   .attr('cy', function(d) { return y(d.temp) })
    //   .attr('r', function(d) { 
    //     return d.violation ? pointRadius : null
    //   })
    //   .style('opacity', 1);

    circles
      .exit()
      .transition()
      .duration(transitionDuration)
      // Leave the cx transition off. Allowing the points to fall where they lie is best.
      //.attr('cx', function(d, i) { return xScale(i) })
      .attr('cy', function() { return y(0) })
      .style("opacity", 1e-6)
      .remove();
  }

  function legalMinimumFor(reading){
    if(reading.isDay === true){
      return '68';
    }else{
      return '55';
    }
  }

  function getCivilianTime(reading){
    if (reading.getHours() > 12){
      return (reading.getHours() - 12) + ":"
        + (reading.getMinutes() >= 10 ?
          reading.getMinutes() : "0" + reading.getMinutes()) 
        + " PM";
    }else{
      return reading.getHours() + ":"
        + (reading.getMinutes() >= 10 ?
          reading.getMinutes() : "0" + reading.getMinutes()) 
        + " AM";
    }
  }

  $('svg circle').tipsy({ 
    gravity: 's',
    html: true,
    topOffset: 2.8,
    leftOffset: 0.3,
    opacity: 1,
    title: function() {
      var d = this.__data__;
      var pDate = d.date;
      return pDate.getDate() + ' '
        + monthNames[pDate.getMonth()] + ' '
        + pDate.getFullYear() + '<br>'
        + days[ pDate.getDay() ] + ' at '
        + getCivilianTime(pDate) + '<br>'
        + '<i>Temperature in Violation</i><br>'
        + '<br>Temperature in Apt: ' + d.temp + '°'
        + '<br>Temperature Outside: ' + d.outdoor_temp + '°'
        + '<br>Legal minimum: ' + legalMinimumFor(d) + '°';
    }
  });

  // Create scrolling line
  var lineMarker = svg.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", h)
    .attr("stroke-width", 5)
    .attr("stroke", "black")
    .style('display', 'none')
    .style('pointer-events', 'none');

  // var circleMarker = svg.append('circle')
  //   .attr('r', 7)
  //   .style('display', 'none')
  //   .style('fill', '#FFFFFF')
  //   .style('pointer-events', 'none')
  //   .style('stroke', '#000')
  //   .style('stroke-width', '3px');


  // Create custom bisector
  var bisect = d3.bisector(function(datum) {
    return datum.date;
  }).left;


  // Add event listeners/handlers
  svg.on('mouseover', function() {
    lineMarker.style('display', 'inherit');
    // circleMarker.style('display', 'inherit');
  }).on('mouseout', function() {
    lineMarker.style('display', 'none');
    // circleMarker.style('display', 'none');
  }).on('mousemove', function() {
    var mouse = d3.mouse(this);
    lineMarker.attr('x1', mouse[0]);
    lineMarker.attr('x2', mouse[0]);
    // circleMarker.attr('cx', mouse[0]);
    // var timestamp = scaleX.invert(mouse[0]),
    //   index = bisect(data, timestamp),
    //   startDatum = data[index - 1],
    //   endDatum = data[index],
    //   interpolate = d3.interpolateNumber(startDatum.value, endDatum.value),
    //   range = endDatum.timestamp - startDatum.timestamp,
    //   valueY = interpolate((timestamp % range) / range);
    // circleMarker.attr('cy', scaleY(valueY));
  });
}

function drawChartBasedOnScreenSize(chartData){
  if (window.innerWidth < 450) {
    var quarterReadings = chartData.slice(119, 167);
    $("#d3-chart").html("")
    draw(quarterReadings);
  }else if(window.innerWidth < 720){
    var halfReadings = chartData.slice(71, 167);
    $("#d3-chart").html("")
    draw(halfReadings);
  }else if(window.innerWidth < 1080){
    var threeQuarterReadings = chartData.slice(23, 167);
    $("#d3-chart").html("")
    draw(threeQuarterReadings);
  }else{
    $("#d3-chart").html("")
    draw(chartData);
  }
}

function drawChartAjaxCall(){
  if($("#d3-chart").length > 0){
    if(/collaborations/.test(document.URL)){
      var URL = /\/users\/\d+\/collaborations\/\d+/.exec(document.URL)[0];
      // returns /user/11/collaborations/35
    } else if ( /live_update/.test(document.URL) ){
      var URL = /\/users\/\d+\/live_update/.exec(document.URL)[0];
      //returns /user/13/live_update
    } else {
      var URL = /\/users\/\d+/.exec(document.URL)[0];
    }
    $.ajax({
      url: URL,
      dataType: "JSON",
      success: function(response){
        if( response.length > 0 ){
          drawChartBasedOnScreenSize(response);
          var resizeTimer = 0;
          window.onresize = function(){
            if (resizeTimer){
              clearTimeout(resizeTimer);
            } 
            resizeTimer = setTimeout(function(){
              drawChartBasedOnScreenSize(response);
            }, 50);
          };
        }
      },
      error: function(response){
        console.log("error");
        console.log(response);
      }
    });
  }
}