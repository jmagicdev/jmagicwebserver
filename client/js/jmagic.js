jQuery.jMagic = jQuery.jMagic || (function($) {

  var sortableOptions = {
    containment: 'parent',
    cursor: 'pointer',
    opacity: 0.8
  };

  var draggableOptions = {
    containment: 'parent',
    opacity: 0.8,
    snap: false,
    // snapMode: 'inner',
    // snapTolerance: 10,
    stack: '.zone.battlefield .gameobject'
  };

  var draggableIsotopeAtomOptions = $.extend({}, draggableOptions, {
    stop: function(event, ui) {
      var $this = $(this);
      var $parent = $this.parent();
      var p = $parent.offset();
      var x = event.clientX - p.left;
      var y = event.clientY - p.top;
      var dx = Math.floor(x / ($.jMagic.dimensions.width  + 10)) * ($.jMagic.dimensions.width  + 10) + p.left + 5;
      var dy = Math.floor(y / ($.jMagic.dimensions.height + 10)) * ($.jMagic.dimensions.height + 10) + p.top  + 5;
      var closestObject = false;
      // console.log([this,dy,dx]);
      $this.siblings().each(function() {
        var offset = $(this).offset();
        // console.log([this,offset.top,offset.left]);
        if (offset.top == dy && offset.left == dx) {
          closestObject = this;
          return false;
        }
      });
      // console.log([this, closestObject]);
      if (closestObject) {
        if (this.id == $this.add(closestObject).first().attr('id')) {
          // If 'this' is moving later in the zone, insert it after the card it landed on.
          $this.insertAfter(closestObject);
          // console.log('after');
        } else {
          // If 'this' is moving earlier in the zone, insert it before.
          $this.insertBefore(closestObject);
          // console.log('before');
        }
      }
      $parent.isotope('reloadItems').isotope({ sortBy: 'original-order' });
    }
  });

  var logIsotopeOptions = {
    animationEngine: 'jquery',
    // resizesContainer: false,
    // layoutMode : 'straightUp'
    layoutMode : 'straightDown'
  }

  var isotopeOptions = {
    animationEngine: 'jquery',
    itemPositionDataEnabled: true,
    resizesContainer: false
  };

  var util = {
    minmax: function(num) {
      var min = false;
      var max = false;

      for (var i in num) {
        switch (typeof(num[i])) {
          case 'number':
            if (min == false || num[i] < min) {
              min = num[i];
            }
            if (max == false || num[i] > max) {
              max = num[i];
            }
            break;

          case 'object':
            if (typeof(num[i].lower) != "undefined" && min == false || num[i].lower < min) {
              min = num[i].lower;
            }
            if (typeof(num[i].upper) != "undefined" && max == false || num[i].upper > max) {
              max = num[i].upper;
            }
            break;

          default:
            alert('MinMax - unhandled type: ' + typeof(num[i]));
            break;
        }
      }

      return [min, max];
    }
  };

  function gameObjectZoom(o) {
    o.mousemove(function(event) {
      var gameObject = $(this);
      var offset = gameObject.offset();

      var bounds = {
        top: offset.top,
        left: offset.left,
        height: gameObject.height(),
        width: gameObject.width()
      };

      var zoomHeight = 310;
      var zoomWidth = 223;
      var zoom = gameObject.clone(false)
        .addClass('zoomed')
        .hide();

      if (zoom.css('background-image') && zoom.css('background-image').indexOf('/sm/') >= 0) {
        zoom.css('background-image', zoom.css('background-image').replace('/sm/', '/lg/'));
      }

      if (typeof(zoom.attr('id')) != "undefined") {
        zoom.removeAttr('id');
      }

      var setCSS = function(event) {
        var css = {
          top: bounds.top - ((event.pageY - bounds.top) * (zoomHeight - bounds.height) / bounds.height),
          left: bounds.left - ((event.pageX - bounds.left) * (zoomWidth - bounds.width) / bounds.width)
        };

        if (event.pageY < css.top || event.pageX < css.left) {
          zoom.mouseleave();
        } else {
          zoom.css(css);
        }
      };

      $('body').append(zoom
        .mousemove(setCSS)
        .click(function(e) {
          e.preventDefault();
          return false;
        })
        .mouseleave(function() {
          $(this).remove();
        }));

      setCSS(event);

      zoom.show();
    });
  }

  // wideLayout: true for wide, false for tall, undefined for 'determine based on size'
  function layoutZone(zone, wideLayout) {
    zone = $('#' + zone);

    if (zone.hasClass('battlefield')) {
      var centers = [];
      zone.children().each(function(index) {
        var $this = $(this);
        var top = $this.css('top');
        var left = $this.css('left');
        if (top == '-1px' && left == '-1px') {
          var id = $this.attr('id');
          var info = $.jMagic.lastState.actual[id];
          var initialTop = 0;
          if (info.controller == $.jMagic.playerID) {
            initialTop = zone.height() - $.jMagic.dimensions.height;
          }
          var initialLeft = $.jMagic.dimensions.height / 2;
          initialTop += initialLeft; // just use this value because it was already calculated
          var searching = true;
          while(searching) {
            searching = false;
            for (var i in centers) {
              if (Math.abs(centers[0] - initialLeft) < $.jMagic.dimensions.height || Math.abs(centers[1] - initialTop) < $.jMagic.dimensions.height) {
                searching = true;
                initialLeft = centers[0] + $.jMagic.dimensions.height;
                break;
              }
            }
          }

          $this
            .draggable(draggableOptions) // Here is where we make stuff on the battlefield draggable.
            .css({
              top: initialTop - $.jMagic.dimensions.height / 2,
              left: initialLeft - $.jMagic.dimensions.height / 2
            });

          centers.push([
            initialLeft,
            initialTop
          ]);
        } else {
          centers.push([
            parseInt(left.replace('px', ''), 10) + $.jMagic.dimensions.height / 2,
            parseInt(top.replace('px', ''), 10) + $.jMagic.dimensions.height / 2
          ]);
        }
      });
    } else {
    /*
      var height = zone.height();
      var width = zone.width();

      var dimensions = $.jMagic.dimensions;
      if (typeof(wideLayout) == "undefined") {
        // Base on the amount of space for everything but the front card.
        wideLayout = ((width - dimensions.width) > (height - dimensions.height));

        // Base on the ratio of height to width, compared to that of a normal card.
        // wideLayout = (width / height > dimensions.width / dimensions.height);
      }

      var children = zone.children();
      var count = children.size();

      var numRows, numPerRow, rowProperty, colProperty, rowOffset, colOffset;
      if (wideLayout) {
        numRows = Math.max(1, Math.floor(height / (dimensions.height + $.jMagic.padding.vertical)));
        numPerRow = Math.ceil(count / numRows);
        rowProperty = "top";
        colProperty = "left";
        rowOffset = ((width - dimensions.width) / (numPerRow - 1));
        colOffset = dimensions.height + $.jMagic.padding.vertical;
      } else {
        numRows = Math.max(1, Math.floor(width / (dimensions.width + $.jMagic.padding.horizontal)));
        numPerRow = Math.ceil(count / numRows);
        rowProperty = "left";
        colProperty = "top";
        rowOffset = ((height - dimensions.height) / (numPerRow - 1));
        colOffset = dimensions.width + $.jMagic.padding.horizontal;
      }

      children.each(function(index) {
        var row = Math.floor(index / numPerRow);
        var col = (index - numPerRow * row);
        var properties = {};
        properties[rowProperty] = row * colOffset;
        properties[colProperty] = col * rowOffset;
        $(this).css(properties);
      });
    // */
    }
  }

  function zoneSpawner(zones) {
    var popup = $('<div />')
      .addClass('zoneSpawnerPopup');

    // use closure for correct scoping of id
    for(var i in zones) {
      (function(id) {
        popup.append($('<div />')
          .addClass('zoneSpawnerPopupChoice')
          .text(i)
          .click(function(e) {
            spawnZone(id);
            popup.hide();
            e.preventDefault();
            return false;
          }));
      })(zones[i]);
    }

    var spawner = $('<div />')
      .addClass('zoneSpawner')
      .click(function(e) {
        var show = !popup.is(':visible');
        // console.log(show);
        $('.zoneSpawnerPopup').hide();
        if (show) {
          popup.css('display', 'block');
          var css = {
            top: e.pageY,
            left: e.pageX
          };
          var w = $(window);
          if (css.top + popup.height() > w.height()) {
            css.top -= popup.height();
          }
          if (css.left + popup.width() > w.width()) {
            css.left -= popup.width();
          }
          popup.css(css);
          $(document).bind('click.jmagic-zoneSpawner', function() {
            $('.zoneSpawnerPopup').hide();
            $(document).unbind('click.jmagic-zoneSpawner');
          });
        }
        e.preventDefault();
        return false;
      });

    $('body').append(popup);

    return spawner;
  };

  function constructInterface(state) {
    var $gamestate = $('#gamestate').empty();

    var zones = zoneSpawner({
      'Command Zone': state.commandZone,
      'Exile Zone': state.exileZone,
      'Stack': state.stack
    }).text('Zones');

    var passButton = $('<div />')
      .attr('id', 'pass-button')
      .addClass('button')
      .addClass('disabled')
      .text('Pass')
      .click(function(e) {
        e.preventDefault();
        if (!$this.hasClass('disabled')) {
          $.jMagic.respondWith($.jMagic.currentChoices);
        }
        return false;
      });

    var toolbar = $('<div />')
      .attr('id', 'toolbar')
      .append(zones)
      .append(passButton);

    for (var i in state.players) {
      var player = state.actual[state.players[i]];

      var zones = {
        'Library': player.library,
        'Hand': player.hand,
        'Graveyard': player.graveyard,
        'Sideboard': player.sideboard
      };

      var div = $('<div />')
        .attr('id', player.ID)
        .addClass('player')
        .append($('<span />')
          .addClass('name'))
        .append($('<span />')
          .addClass('lifeTotal'))
        .append(
          zoneSpawner(zones)
            .text('Z')
            .addClass('button'));

      if (player.ID == $.jMagic.playerID) {
        div.addClass('localPlayer');
        toolbar.append(div);
      } else {
        div.addClass('opponent');
        toolbar.prepend(div);
      }
    }

    var battlefield = $('<div />')
      .addClass('battlefield zone')
      .attr('id', state.battlefield);

    var battlefieldContainer = $('<div />')
      .addClass('battlefield-container')
      .append(battlefield);

    var log = $('<div />')
      .attr('id', 'log')
      .isotope(logIsotopeOptions);

    var logContainer = $('<div />')
      .attr('id', 'log-container')
      .append(log);

    $gamestate
      .append(toolbar)
      .append(logContainer)
      .append(battlefieldContainer);

    battlefieldContainer
      .scrollTop((battlefield.height() - battlefieldContainer.height()) / 2)
      .scrollLeft((battlefield.width() - battlefieldContainer.width()) / 2);
  }

  function populateZone(id) {
    var zone = $('#' + id);
    if (zone.length > 0) {
      var objects = $.jMagic.lastState.actual[id].objects.slice(0); // shallow copy the array
      zone.children().each(function() {
        var $this = $(this);
        var child = parseInt($this.attr('id'), 10);
        var index = $.inArray(child, objects);
        if (index > -1) {
          // item still exists, remove it from the list of items to create
          objects.splice(index, -1);
        } else {
          // item no longer exists, remove it
          $this.remove();
        }
      });
      // create any remaining items that did not previously exist
      var spawned = spawnObject(objects);
      if (zone.hasClass("battlefield")) {
        zone.append(spawned.css({
          top: -1,
          left: -1
        }));
      } else {
        zone
          .isotope('insert', spawned
            .draggableIsotopeAtom(draggableIsotopeAtomOptions));
      }
    }
  }

  function spawnZone(id) {
    var zone = $('#' + id);
    if (zone.length > 0) {
      zone.focus();
    } else {
      zone = $('<div />')
        .attr('id', id)
        .addClass('zone vertical-zone');
    }

    var info = $.jMagic.lastState.actual[id];
    zone.append(
      spawnObject(info.objects)
        .draggableIsotopeAtom(draggableIsotopeAtomOptions));

    zone
      // .sortable(sortableOptions) // Removed sortable in favor of isotope + draggable
      .isotope(isotopeOptions)
      .dialog({
        title: info.name,
        width: 'auto',
        height: $.jMagic.dimensions.width,
        resize: function(event, ui) {
          layoutZone(id);
        }
      });
    layoutZone(id);
  }

  var spawnObject = (function() {

    function calculateFrame(info) {
      var isLand = $.inArray('LAND', info.characteristics.ACTUAL.types) >= 0;
      var colors = (isLand ? info.canProduce : info.characteristics.ACTUAL.colors);

      var frame = '';
      if (isLand) {
        frame += 'l';
      } else if ($.inArray('ARTIFACT', info.characteristics.ACTUAL.types) >= 0) {
        frame += 'a';
      } else if (colors.length == 0) {
        frame += 'a';
      }

      if (colors.length > 2) {
        frame += 'm';
      } else if (colors.length > 1 && typeof(info.characteristics.ACTUAL.manaCost) != "undefined") {
        for (var i in info.characteristics.ACTUAL.manaCost) {
          if (info.characteristics.ACTUAL.manaCost[i].colors.length == 1) {
            frame += 'm';
            break;
          }
        }
      }

      frame += colorString(colors);

      return frame;
    }

    function calculateText(info) {
      console.log('calculate text:');
      console.log(info);

      var text = '';
      var c = info.characteristics.ACTUAL;

      if (info.counters.length > 0) {

        var counterCounts = {};
        for (var i in info.counters) {
          var counter = info.counters[i];
          if (typeof(counterCounts[counter.type]) == "undefined") {
            counterCounts[counter.type] = 1;
          } else {
            counterCounts[counter.type] = counterCounts[counter.type] + 1;
          }
        }

        var keys = Object.keys(counterCounts);
        keys.sort();
        for (var i in counterCounts) {
          text += "\n\n" + counterCounts[i] + ' ' + i + (counterCounts[i] == 1 ? '' : 's');
        }
      }

      if (info.zoneID == $.jMagic.lastState.stack && info.valueOfX != -1) {
        text += "\n\nX is " + info.valueOfX + ".";
      }

      if (info.otherLinks.length > 0) {
        text += "\n\n" + info.otherLinks; // TODO - this is probably wrong
      }

      // TODO - activated ability handling, else...
      if (c.costs.length > 0) {
        text += "\n\nAs an additional cost to cast " + info.name + ", " + c.costs.join(' ') + ".";
      }

      var keywords = [];
      for (var i in c.abilities) {
        // -1 is a marker for where on the card the modes with effects are
        if (c.abilities[i] == -1) {
          text += "\n\n";
          var modeSeparator = "\n\n";
          var beforeFinalMode = "";
          if (c.modes.length != 1 && c.modes.length != c.selectedModes.length) {
            if (c.selectedModes.length > 0) {
              alert('TODO - dealing with "selected modes"');
            }

            var range = util.minmax(c.numModes);
            if (range[0] === false) {
              range[0] = 1;
            }

            if (range[0] === range[1]) {
              text += 'Choose ' + range[0];
            } else if (range[1] === false) {
              text += 'Choose ' + range[0] + ' or more';
            } else if (range[0] === 1 && range[1] === 2) {
              text += 'Choose one or both';
            } else {
              text += 'Choose between ' + range[0] + ' and ' + range[1];
            }
            text += ' &mdash; ';

            if (range[1] == false || range[1] === c.modes.length) {
              modeSeparator = '; ';
              beforeFinalMode = '; and/or ';
            } else {
              modeSeparator = '; or ';
              beforeFinalMode = '; or ';
            }
          }

          var modesCounted = 0;
          for (var j in c.modes) {
            if (modesCounted != 0) {
              if (modesCounted == c.modes.length - 1) {
                text += beforeFinalMode;
              } else {
                text += modeSeparator;
              }
            }

            var effects = [];
            for (var k in c.modes[j].effects) {
              if (c.modes[j].effects[k] != '') {
                effects.push(c.modes[j].effects[k]);
              }
            }

            effects = effects.join(' ');

            if (c.modes.length > 1 && $.inArray(c.modes[j], c.selectedModes)) {
              effects = '<b>' + effects + '</b>';
            }

            text += effects;
            modesCounted++;
          }
        } else {
          var ability = $.jMagic.lastState.actual[c.abilities[i]];
          if (ability.isKeyword) {
            keywords.push(ability.name);
          } else {
            if (keywords.length > 0) {
              text += "\n\n" + keywords.join(', ');
              keywords = [];
            }
            text += "\n\n" + ability.name;
          }
        }
      }

      return text.substring(2).replace(/\n/g, '<br />');
    }

    function typeline(info) {
      var c = info.characteristics.ACTUAL;
      var text = c.types.join(' ');
      if (c.superTypes.length > 0) {
        text = c.superTypes.join(' ') + ' ' + text;
      }
      if (c.subTypes.length > 0) {
        text += ' &mdash; ' + c.subTypes.join(' ');
      }
      return text.replace(/(^| )([A-Z])([A-Z']*)/g, function(x, a, b, c) {
        return x.replace(c, c.toLowerCase());
      });;
    }

    function manaCost(info) {
      if (typeof(info.characteristics.ACTUAL.manaCost) == "undefined") {
        return '';
      }

      var text = '';
      for (var i in info.characteristics.ACTUAL.manaCost) {
        text += manaSymbol(info.characteristics.ACTUAL.manaCost[i]);
      }
      return text;
    }

    function manaSymbol(m) {
      if (m.isX) {
        return '(X)';
      }

      var text = '';
      if (m.colorless > 0) {
        text += m.colorless;
      }

      switch (m.colors.length) {
        case 0:
          if (m.colorless == 0) {
            return '(0)';
          }
          break;
        case 1:
        case 2:
          text += colorString(m.colors).toUpperCase();
          break;
        case 5:
          text += 'WUBRG';
          break;
        default:
          text += 'M'; // this should be impossible
          break;
      }

      if (m.isPhyrexian) {
        text += 'P';
      }

      return '(' + text + ')';
    }

    function colorString(colors) {
      var text = '';
      if (colors.length == 0 || colors.length == 3 || colors.length == 4) {
        // change nothing
      } else if (colors.length == 1) {
        for(var i in colors) {
          if (colors[i] == 'WHITE') {
            text += 'w';
          } else if (colors[i] == 'BLUE') {
            text += 'u';
          } else if (colors[i] == 'BLACK') {
            text += 'b';
          } else if (colors[i] == 'RED') {
            text += 'r';
          } else if (colors[i] == 'GREEN') {
            text += 'g';
          }
        }
      } else if (colors.length == 2) {
        var w = $.inArray('WHITE', colors) >= 0;
        var u = $.inArray('BLUE', colors) >= 0;
        var b = $.inArray('BLACK', colors) >= 0;
        var r = $.inArray('RED', colors) >= 0;
        var g = $.inArray('GREEN', colors) >= 0;

        if(w && u) {
          text += 'wu';
        } else if(u && b) {
          text += 'ub';
        } else if(b && r) {
          text += 'br';
        } else if(r && g) {
          text += 'rg';
        } else if(g && w) {
          text += 'gw';
        } else if(w && b) {
          text += 'wb';
        } else if(u && r) {
          text += 'ur';
        } else if(b && g) {
          text += 'bg';
        } else if(r && w) {
          text += 'rw';
        } else if(g && u) {
          text += 'gu';
        }
      }

      return text;
    }

    function smallIcons(text) {
      return text.replace(/\(([^\)]+)\)/g, '<img class="small-icon" src="css/images/sm/$1.png" />')
    }

    return function(id) {
      if (typeof(id) == "object") {
        var ret = $();
        for (var i in id) {
          ret = ret.add(spawnObject(id[i]));
        }
        return ret;
      }
      var object = $('#' + id);
      if (object.length == 0) {
        object = $('<div />')
          .attr('id', id)
          .addClass('gameobject')
          .append($('<div />')
            .addClass('cardcontainer')
            .append($('<span />')
              .addClass('cardcost'))
            .append($('<span />')
              .addClass('cardname'))
            .append($('<span />')
              .addClass('cardart'))
            .append($('<span />')
              .addClass('cardtype'))
            .append($('<span />')
              .addClass('cardtext')));

        gameObjectZoom(object);
      }

      if (typeof($.jMagic.lastState.actual[id]) != "undefined") {
        var info = $.jMagic.lastState.actual[id];
        $('.cardname', object).text(info.name);
        $('.cardart', object).css('background-image', 'url("css/images/cardart/' + info.name + '.jpg")');

        var frame = calculateFrame(info);
        object.css('background-image', 'url("css/images/sm/frame_' + frame + '.png")');

        // TODO: specific type discovery and handling
        $('.cardcost', object).html(smallIcons(manaCost(info)));
        $('.cardtype', object).html(typeline(info));
        $('.cardtext', object).html(smallIcons(calculateText(info)));
      } else {
        object.addClass("face-down");
      }

      return object;
    }
  })();

  function sanitizeText(text) {
    return text.replace(/[^a-z0-9]/gi, '');
  }

  var handleChoose = (function() {
    function chooseText(parameterObject, minimum, maximum) {
      var exactlyOne = ((minimum === 1) && (maximum === 1));

      // TODO - sort input

      var choiceContainer = $('<div />')
        .addClass('text-choice-container');

      for (var i in parameterObject.choices) {
        var choiceText = parameterObject.choices[i];
        if (typeof(choiceText) == "object") {
          choiceText == choiceText.name;
        }
        choiceContainer.append($('<div />')
          .addClass('text-choice-wrapper')
          .append($('<input />')
            .attr('type', exactlyOne ? 'radio' : 'checkbox')
            .attr('id', 'text-choice-' + i)
            .data('chooseIndex', i))
          .append($('<label />')
            .attr('for', 'text-choice-' + i)
            .text(choiceText)));
      }

      var tcp = $('<form />');

      tcp
        .attr('id', 'text-choice-form')
        .append(choiceContainer)
        .append($('<input />')
          .attr('type', 'submit')
          .click(function(e) {
            e.preventDefault();
            var response = [];
            $('#text-choice-form input:checked').each(function() {
              response.push($(this).data('chooseIndex'));
            });
            $.jMagic.respondWith(response);
            tcp.dialog('close');
            return false;
          }))
        .dialog();
    }

    return function(parameterObject) {
      var range = util.minmax(parameterObject.number);
      var minimum = range[0];
      var maximum = range[1];

      if (minimum === false) {
        minimum = 0;
      }

      if (maximum === false) {
        maximum = parameterObject.choices.length;
      }

      $.jMagic.log(parameterObject.reason.query);

      togglePassButton(minimum <= 0);
      $.jMagic.currentChoices = [];

      switch(parameterObject.type) {
        case 'PLAYER':
          var choices = jQuery();

          for (var i in parameterObject.choices) {
            switch(determineType(parameterObject.choices[i])) {
              case 'player':
                choices = choices
                  .add($('#' + parameterObject.choices[i].ID)
                  .data('chooseIndex', i));
                break;

              default:
                alert('Unhandled object type in choose!');
                break;
            }
          }

          choices
            .addClass('selectable')
            .bind('click.selectable', function() {
              var jthis = $(this);
              var index = jthis.data('chooseIndex');
              if (maximum == 1) {
                $.jMagic.respondWith([index]);
              } else {
                var position = jQuery.inArray(index, $.jMagic.currentChoices);
                if (position >= 0) {
                  $.jMagic.currentChoices.splice(position, 1);
                  jthis.removeClass('selected');
                } else {
                  $.jMagic.currentChoices.push(index);
                  jthis.addClass('selected');
                }

                togglePassButton($.jMagic.currentChoices.length >= minimum && $.jMagic.currentChoices.length <= maximum, 'Done');
              }
            });
          break;

        // text choice dialog
        case 'EVENT':
          chooseText(parameterObject, minimum, maximum);
          break;

        default:
          alert('Unhandled choose type: ' + parameterObject.type);
          break;
      }
    }
  })();

  function togglePassButton(enable, name) {
    if(typeof(name) == "undefined") name = "Pass";
    var pb = $('#pass-button').text(name);
    if (pb.hasClass('disabled') == enable) {
      pb.toggleClass('disabled');
    }
  }

  function updateState() {
    $('.zone').each(function() {
      var id = $(this).attr('id');
      populateZone(id);
      layoutZone(id);
    });
    for (var i in $.jMagic.lastState.players) {
      updatePlayer($.jMagic.lastState.players[i]);
    }
  }

  function updatePlayer(id) {
    var player = $('#' + id);
    var info = $.jMagic.lastState.actual[id];

    $('.name', player).text(info.name);
    $('.lifeTotal', player).text(info.lifeTotal);
    $('.library input', player).text("Library: " + $.jMagic.lastState.actual[info.library].objects.length);
    $('.hand input', player).text("Hand: " + $.jMagic.lastState.actual[info.hand].objects.length);
    $('.graveyard input', player).text("Graveyard: " + $.jMagic.lastState.actual[info.library].objects.length);
    $('.sideboard input', player).text("Sideboard: " + $.jMagic.lastState.actual[info.sideboard].objects.length);
  }

  function determineType(o) {
    if(typeof(o.lifeTotal) != "undefined") {
      return 'player';
    } else {
      alert('Unknown type of object!');
    }
  }

  return {
    dimensions: {
      height: 130,
      width: 94
    },
    deck: [],
    gameRunning: true,
    serverUrl: '',
    playerID: -1,
    lastState: false,
    currentChoices: [],
    log: function(msg, sender) {
      if (typeof(sender) == "undefined") {
        sender = false;
      }

      var message = $('<div />')
        .addClass('log-message');

      if (sender) {
        message.append($('<span />')
          .addClass('log-message-sender')
          .text(sender));
      }

      message.append($('<span />')
        .addClass('log-message-text')
        .text(msg));

      var log = $('#log')
        .append(message)
        .isotope('reloadItems')
        .isotope({ sortBy: 'original-order' });

      $('#log-container')
        .stop()
        .animate({ scrollTop: log.height() - $("#log-container").height() + log.children().first().outerHeight(true) }, 1000);
    },
    handleUpdate: function(data) {
      if (data.func != 'alertState' && data.func != 'alertEvent') {
        $.jMagic.log('handling update - ' + data.func, 'DEBUG');
      }
      switch (data.func) {
        case "alertChoice":
          // parameters:
          //  playerID: The id of the player who made the choice
          //  choice: An object describing the choice made
          // returns:
          //  (none)
          if (data.playerID && $.jMagic.lastState && typeof($.jMagic.lastState.actual[data.playerID]) != "undefined") {
            $.jMagic.log(data.choice, $.jMagic.lastState.actual[data.playerID].name);
          } else {
            $.jMagic.log(data.choice);
          }
          break;
        case "alertError":
          // parameters:
          //  errorType: The name of the class of error.
          //  parameters: An object describing the error.
          // returns:
          //  (none)
          switch (data.errorType) {
            case "CardLoadingError":
              alert('The following cards are not currently supported: ' + data.parameters.cardNames.join(', '));
              break;

            default:
              alert('Unhandled error type: ' + data.errorType);
              break;
          }
          /***************************************************************************************TODO*******************************************************************************************/
          break;
        case "alertEvent":
          // parameters:
          //  event: An object describing the event that has occurred.
          // returns:
          //  (none)
          /***************************************************************************************TODO*******************************************************************************************/
          break;
        case "alertState":
          // parameters:
          //  sanitizedGameState: An object describing the current state of
          //                      the game, as visible to the current player.
          // returns:
          //  (none)
          var oldState = $.jMagic.lastState;
          $.jMagic.lastState = data.sanitizedGameState;
          if (!oldState) {
            constructInterface($.jMagic.lastState);
          }
          updateState();
          break;
        case "alertStateReversion":
          // parameters:
          //  parameters: An object describing the state reversion that
          //              has already occurred.
          // returns:
          //  (none)
          /***************************************************************************************TODO*******************************************************************************************/
          break;
        case "alertWaiting":
          // parameters:
          //  who: The player from whom the game is currently waiting for a response.
          // returns:
          //  (none)
          $.jMagic.log("Waiting on " + (typeof(data.who) == "undefined" ? "the game" : data.who.name) + "...")
          break;
        case "choose":
          // parameters:
          //  parameterObject: An object describing the available choices, the number
          //                   of choices to make, and a human-readable string describing
          //                   the purpose of the choice.
          // returns:
          //  An array of integers representing the the indices of the choices.  If the
          //  choice is ordered, the integers should be in the order that the choices
          //  will be.  An empty array represents choosing nothing.
          handleChoose(data.parameterObject);
          break;
        case "chooseNumber":
          // parameters:
          //  range: an object with "lower" and "upper" properties describing
          //         the bounds of the choosable range.  Either/both properties
          //         may be null, indicating no bound on their respective end.
          //  description: A human-readable string explaining the choice.
          // returns:
          //  an integer
          /***************************************************************************************TODO*******************************************************************************************/
          break;
        case "divide":
          // parameters:
          //  quantity: total amount to divide
          //  minimum: the minimum to assign to each target
          //  targets: an array of targets to assign amounts to
          // returns:
          //  (not yet determined)
          /***************************************************************************************TODO*******************************************************************************************/
          break;
        case "getDeck":
          // parameters:
          //  (none)
          // returns:
          //  an array of strings representing card names
          $.jMagic.respondWith($.jMagic.deck);
          break;
        case "getName":
          // parameters:
          //  (none)
          // returns:
          //  The name of the current player, as a String.
          $.jMagic.respondWith("Player");
          break;
        case "setPlayerID":
          // parameters:
          //  playerID: The ID that will be used to represent the current player.
          // returns:
          //  (none)
          $.jMagic.playerID = data.playerID;
          break;
        case "noUpdate":
          // Not a real function, this only indicates that nothing has been sent
          // to the player during this poll.
          /***************************************************************************************TODO*******************************************************************************************/
          break;
      }
    },
    requestUpdate: function() {
      if (!this.gameRunning)
        return;
      $.ajax({
        type: 'POST',
        url: this.serverUrl + 'requestUpdate.jsp',
        data: {},
        complete: function(jqXHR, textStatus) {
          setTimeout(function() {
            $.jMagic.requestUpdate();
          }, 1);
        },
        success: function(data, textStatus, jqXHR) {
          if (typeof(data.error) != "undefined") {
            $.jMagic.gameRunning = false;
          }
          $.jMagic.handleUpdate(data);
        },
        dataType: 'jsonp'
      });
    },
    startGame: function() {
      $.ajax({
        type: 'POST',
        url: this.serverUrl + 'start.jsp',
        data: {
          clear: 'all' // TODO : remove this before production
        },
        success: function(data, textStatus, jqXHR) {
          var joinUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?key=" + data._keyTwo;
          $('#gamestate').html(
            $('<a>')
              .attr('href', joinUrl)
              .text('Send this link to the other player so they can join.'));
          setTimeout(function() {
            $.jMagic.requestUpdate();
          }, 1);
        },
        dataType: 'jsonp'
      });
    },
    joinGame: function(key) {
      $.ajax({
        type: 'POST',
        url: this.serverUrl + 'join.jsp',
        data: {
          key: key
        },
        success: function(data, textStatus, jqXHR) {
          if (typeof(data.error) == "undefined") {
            $('#gamestate').html(data.status);
            setTimeout(function() {
              $.jMagic.requestUpdate();
            }, 1);
          } else {
            $('#gamestate').html(data.error);
          }
        },
        dataType: 'jsonp'
      });
    },
    respondWith: function(response, onSuccess) {
      if (!this.gameRunning)
        return;
      if (typeof(onSuccess) != "function") {
        onSuccess = function() {};
      }
      $('.selectable').removeClass('selectable').unbind('click.selectable');
      $('.selected').removeClass('selected');
      $.ajax({
        type: 'POST',
        url: this.serverUrl + 'respondWith.jsp',
        data: {
          response: JSON.stringify(response)
        },
        success: onSuccess,
        dataType: 'jsonp'
      });
    },
    initialize: function(url) {
      $.jMagic.serverUrl = url;
      var getParameterByName = function(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if(results == null)
          return "";
        else
          return decodeURIComponent(results[1].replace(/\+/g, " "));
      };

      var key = getParameterByName("key");

      var gs = $('<div />')
        .attr('id', 'gamestate')
        .addClass('ui-widget');

      $('body').append(gs);

      gs.empty()
        .append($('<p />')
          .text(key == "" ? 'No active game.  Start a game?' : 'Would you like to join this game?'))
        .append($('<textarea />')
          .val('12 Island\r\n3 Flooded Strand\r\n3 Polluted Delta\r\n2 Brain Freeze\r\n4 Brainstorm\r\n2 Cryptic Command\r\n3 Cunning Wish\r\n2 Flash of Insight\r\n4 Force of Will\r\n4 High Tide\r\n4 Impulse\r\n3 Meditate\r\n3 Opt\r\n1 Peek\r\n2 Remand\r\n4 Reset\r\n3 Turnabout')
          .attr('rows', '20')
          .attr('cols', '50')
          .attr('id', 'deck-builder')
          .bind('dragover', function(e) {
            e = e.originalEvent;
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          })
          .bind('drop', function(e) {
            e = e.originalEvent;
            e.stopPropagation();
            e.preventDefault();

            var files = e.dataTransfer.files;
            var output = [];
            for (var i = 0, f; f = files[i]; i++) {
              if (!f.type == 'text/plain') {
                continue;
              }

              var reader = new FileReader();

              reader.onload = (function(file) {
                return function(e) {
                  var deckbuilder = $('#deck-builder');
                  deckbuilder.val((deckbuilder.val().trim() + "\r\n" + e.target.result).trim());
                };
              })(f);

              reader.readAsText(f);
            }
          }))
        .append($('<input />')
          .attr('type', 'button')
          .attr('value', 'Submit Deck')
          .click(function(e) {
            e.preventDefault();
            $.jMagic.deck = $('#deck-builder').val().split(/[\r\n]+/);
            if (key == "") {
              $.jMagic.startGame();
            } else {
              $.jMagic.joinGame(key);
            }
            return false;
          }));
    }
  };
})(jQuery);