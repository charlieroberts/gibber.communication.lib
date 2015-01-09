!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Gibber=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./scripts/client/gibber/communication.lib.js":[function(require,module,exports){
!function() {
  
  var Gibber =  require( 'gibber.core.lib' )
  module.exports = require( './communication.js')( Gibber )

}()
},{"./communication.js":"/Users/charlie/Documents/code/gibber.communication.lib/scripts/client/gibber/communication.js","gibber.core.lib":"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/gibber.js"}],"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/dollar.js":[function(require,module,exports){
(function (global){
!function() {

"use strict"

var hasZepto = typeof Zepto === 'function',
    hasJQuery = typeof jQuery === 'function',
    has$ = typeof global.$ === 'object' || typeof global.$ === 'function',
    $ = null,
    hasConflict = hasZepto || hasJQuery || has$,
    isArray = Array.isArray,
    isObject = function( obj ) { return typeof obj === 'object' },
    isPlainObject = function( obj ) {
      return isObject(obj) && Object.getPrototypeOf( obj ) == Object.prototype
    }

if( !hasConflict ) {
  $ = {}
}else if( hasJQuery ) {
  $ = jQuery 
}else if( hasZepto ) {
  $ = Zepto
}else if( has$ ){
  $ = global.$
}else{
  $ = {}
}

// taken from Zepto: zeptojs.com
function extend(target, source, deep) {
  for (var key in source)
    if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
      if (isPlainObject(source[key]) && !isPlainObject(target[key]))
        target[key] = {}
      if (isArray(source[key]) && !isArray(target[key]))
        target[key] = []
      extend(target[key], source[key], deep)
    }
    else if (source[key] !== undefined) target[key] = source[key]
}

if( !hasConflict ) {
  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function( target ){
    var deep, args = Array.prototype.slice.call(arguments, 1)

    if (typeof target === 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }
  
  $.isArray = Array.isArray 
  $.isPlainObject = isPlainObject

  $.type = function( val ) {
    return typeof val
  }
}

var events = {}
$.subscribe   = function( key, fcn ) { 
  if( typeof events[ key ] === 'undefined' ) {
    events[ key ] = []
  }
  events[ key ].push( fcn )
}

$.unsubscribe = function( key, fcn ) {
  if( typeof events[ key ] !== 'undefined' ) {
    var arr = events[ key ]
    
    arr.splice( arr.indexOf( fcn ), 1 )
  }
}

$.publish = function( key, data ) {
  if( typeof events[ key ] !== 'undefined' ) {
    var arr = events[ key ]
    for( var i = 0; i < arr.length; i++ ) {
      arr[ i ]( data )
    }
  }
}

module.exports = $

}()
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/gibber.js":[function(require,module,exports){
(function() {
//"use strict" 
// can't use strict because eval is used to evaluate user code in the run method
// I should wrap this in a Function call instead...
var $ = require( './dollar' )

var Gibber = {
  dollar: $,
  Presets: {},
  GraphicsLib: {},
  Binops: {},
  scale : null,
  minNoteFrequency:50,
  started:false,
  outputCurves : {
    LINEAR:0,
    LOGARITHMIC:1
  },
  
  export: function( target ) {
    Gibber.Utilities.export( target )
    
    if( Gibber.Audio ) {
      Gibber.Audio.export( target )
    }
    
    if( Gibber.Graphics ) {
      Gibber.Graphics.export( target )
    }
    
    if( Gibber.Interface ) {
      Gibber.Interface.export( target )
    }
  },
  
  init: function( _options ) {                        
      if( typeof window === 'undefined' ) { // check for node.js
        window = GLOBAL // is this a good idea? makes a global window available in all files required in node
        document = GLOBAL.document = false
      }else if( typeof GLOBAL !== 'undefined' ) { // I can't remember why I put this in there...
        if( !GLOBAL.document ) document = GLOBAL.document = false
      }
      
      var options = {
        globalize: true,
        canvas: null,
        target: window,
        graphicsMode:'3d'
      }
      
      if( typeof _options === 'object' ) $.extend( options, _options )
      
      if( Gibber.Audio ) {
        Gibber.Audio.init() 
      
        if( options.globalize ) {
          options.target.Master = Gibber.Audio.Master    
        }else{
          $.extend( Gibber, Gibber.Audio )
        }        
      }
      
      if( Gibber.Graphics ) {
        // this happens dynamically when a graphics object is first created to save CPU
        // Gibber.Graphics.init( options.graphicsMode ) 
      }
      
      if( Gibber.Interface ) {}
      
      if( options.globalize ) {
        Gibber.export( options.target )
      }
      
      options.target.$ = $ // TODO: geez louise
            
      Gibber.Utilities.init()
      
      // Gibber.isInstrument = true
  },
  // interfaceIsReady : function() {
  //   if( !Gibber.started ) {
  //     if( typeof Gibber.Audio.context.currentTime !== 'undefined' ) {
  //       Gibber.started = true
  //       if( Gibber.isInstrument ) eval( loadFile.text )
  //     }
  //   }
  // },
  Modules : {},
 	import : function( path, exportTo ) {
    var _done = null;
    console.log( 'Loading module ' + path + '...' )

    if( path.indexOf( 'http:' ) === -1 ) { 
      console.log( 'loading via post', path )
      $.post(
        Gibber.Environment.SERVER_URL + '/gibber/'+path, {},
        function( d ) {
          d = JSON.parse( d )
                    
          var f = new Function( "return " + d.text )
          
          Gibber.Modules[ path ] = f()
          
          if( exportTo && Gibber.Modules[ path ] ) {
            $.extend( exportTo, Gibber.Modules[ path ] )
            //Gibber.Modules[ path ] = exportTo
          }
          if( Gibber.Modules[ path ] ) {
            if( typeof Gibber.Modules[ path ].init === 'function' ) {
              Gibber.Modules[ path ].init()
            }
            console.log( 'Module ' + path + ' is now loaded.' )
          }else{
            console.log( 'Publication ' + path + ' is loaded. It may not be a valid module.')
          }
          
          if( _done !== null ) { _done( Gibber.Modules[ path ] ) }

          return false;
        }
      )
    }else{
      var script = document.createElement( 'script' )
      script.src = path
      
      script.onload = function () {
        console.log( 'Module ' + path + ' is now loaded.' )
        if( _done !== null ) { _done() }
      };

      document.head.appendChild( script )
    }
    return { done: function( fcn ) { _done =  fcn } }
 	},  
  
  // log: function( msg ) { 
  //   //console.log( "LOG", typeof msg )
  //   if( typeof msg !== 'undefined' ) {
  //     if( typeof msg !== 'function') {
  //       console.log( msg )
  //     }else{
  //       console.log( 'Function' )
  //     }
  //   }
  // },
  
  scriptCallbacks: [],
  
  run: function( script, pos, cm ) { // called by Gibber.Environment.Keymap.modes.javascript
		var _start = pos.start ? pos.start.line : pos.line,
				tree
    
	  try{
			tree = Gibber.Esprima.parse(script, { loc:true, range:true} )
		}catch(e) {
			console.error( "Parse error on line " + ( _start + e.lineNumber ) + " : " + e.message.split(':')[1] )
			return
		}
    
    // must wrap i with underscores to avoid confusion in the eval statement with commands that use proxy i
    for( var __i__ = 0; __i__ < tree.body.length; __i__++ ) {
      var obj = tree.body[ __i__ ],
					start = { line:_start + obj.loc.start.line - 1, ch: obj.loc.start.column },
					end   = { line:_start + obj.loc.end.line - 1, ch: obj.loc.end.column },
				  src   = cm.getRange( start, end ),
          result = null
			
			//console.log( start, end, src )
			try{
				result = eval( src )
        if( typeof result !== 'function' ) {
          log( result )
        }else{
          log( 'Function' )
        }
			}catch( e ) {
				console.error( "Error evaluating expression beginning on line " + (start.line + 1) + '\n' + e.message )
			}
      
      if( this.scriptCallbacks.length > 0 ) {
        for( var ___i___ = 0; ___i___ < this.scriptCallbacks.length; ___i___++ ) {
          this.scriptCallbacks[ ___i___ ]( obj, cm, pos, start, end, src, _start )
        }
      }
    }
  },
  
  processArguments: function(args, type) {    
    var obj
    
    if( args.length ) {
      if( typeof args[0] === 'string' && type !== 'Drums' && type !== 'XOX' ) {
        obj = Gibber.getPreset( args[0], type )
        
        if( typeof args[1] == 'object' ) {
          $.extend( obj, args[ 1 ] )
        }
        return obj
      }
      return Array.prototype.slice.call(args, 0)
    }
    
    return obj
  },
  
  processArguments2 : function(obj, args, type) {
    if( args.length ) {
      var firstArg = args[ 0 ]
    
      if( typeof firstArg === 'string' && type !== 'Drums' && type !== 'XOX' && type !== 'Shader' ) {
        preset = Gibber.getPreset( args[0], type )
      
        if( typeof args[1] === 'object' ) {
          $.extend( preset, args[ 1 ] )
        }
      
        $.extend( obj, preset )
        
        if( obj.presetInit ) obj.presetInit() 
      }else if( $.isPlainObject( firstArg ) && typeof firstArg.type === 'undefined' ) {
        $.extend( obj, firstArg )
      }else{
        var keys = Object.keys( obj.properties )
                
        if( obj.type === 'FX' ) {
          for( var i = 0; i < args.length; i++ ) { obj[ keys[ i + 1 ] ] = args[ i ] }
        }else{
          for( var i = 0; i < args.length; i++ ) { obj[ keys[ i ] ] = args[ i ] }
        }
        
      }
    }      
  },
    
  getPreset: function( presetName, ugenType ) {
    var obj = {}
    
    if( Gibber.Presets[ ugenType ] ) {
      if( Gibber.Presets[ ugenType ][ presetName ] ) {
        obj = Gibber.Presets[ ugenType ][ presetName ]
      }else{
        Gibber.log( ugenType + ' does not have a preset named ' + presetName + '.' )
      }
    }else{
      Gibber.log( ugenType + ' does not have a preset named ' + presetName + '.' )
    }
    
    return obj
  },
  
  clear : function() {
    if( Gibber.Audio ) Gibber.Audio.clear();
    
    if( Gibber.Graphics ) Gibber.Graphics.clear()

    Gibber.proxy( window )
		
    $.publish( '/gibber/clear', {} )
        
    console.log( 'Gibber has been cleared.' )
  },
  
  proxy: function( target ) {
		var letters = "abcdefghijklmnopqrstuvwxyz"
    
		for(var l = 0; l < letters.length; l++) {
			var lt = letters.charAt(l);
      if( typeof window[ lt ] !== 'undefined' ) { 
        delete window[ lt ] 
        delete window[ '___' + lt ]
      }

      (function() {
				var ltr = lt;
      
				Object.defineProperty( target, ltr, {
          configurable: true,
					get:function() { return target[ '___'+ltr] },
					set:function( newObj ) {
            if( newObj ) {
              if( target[ '___'+ltr ] ) { 
                if( typeof target[ '___'+ltr ].replaceWith === 'function' ) {
                  target[ '___'+ltr ].replaceWith( newObj )
                  console.log( target[ '___'+ltr ].name + ' was replaced with ' + newObj.name )
                }
              }
              target[ '___'+ltr ] = newObj
            }else{
						  if( target[ '___'+ltr ] ) {
						  	 var variable = target[ '___'+ltr ]
						  	 if( variable ) {
						  		 if( typeof variable.kill === 'function' /*&& target[ '___'+ltr ].destinations.length > 0 */) {
						  			 variable.kill();
						  		 }
						  	 }
						  }
            }
          }
        });
      })();     
    }
  },

  construct: function( constructor, args ) {
    function F() {
      return constructor.apply( this, args );
    }
    F.prototype = constructor.prototype;
    return new F();
  },

  createMappingObject : function(target, from) {
    var min = typeof target.min === 'function' ? target.min() : target.min,
        max = typeof target.max === 'function' ? target.max() : target.max,
        _min = typeof from.min === 'function' ? from.min() : from.min,
        _max = typeof from.max === 'function' ? from.max() : from.max
    
    // console.log( "MAPPING", from, target )
    if( typeof from.object === 'undefined' && from.Value) { // if using an interface object directly to map
      from = from.Value
    }
    
    if( typeof target.object[ target.Name ].mapping !== 'undefined') {
      target.object[ target.Name ].mapping.replace( from.object, from.name, from.Name )
      return
    }
    
    if( typeof from.targets !== 'undefined' ) {
      if( from.targets.indexOf( target ) === -1 ) from.targets.push( [target, target.Name] )
    }
    
    var fromTimescale = from.Name !== 'Out' ? from.timescale : 'audioOut' // check for audio Out, which is a faux property
    
    //console.log( target.timescale, fromTimescale )
    
    mapping = Gibber.mappings[ target.timescale ][ fromTimescale ]( target, from )
    
    //target.object[ target.name ].toString = function() { return '> continuous mapping: ' + from.name + ' -> ' + target.name }
    
    Object.defineProperties( target.object[ target.Name ], {
      'min' : {
        configurable:true,
        get : function() { return min },
        set : function(v) { min = v;  target.object[ target.Name ].mapping.outputMin = min }
      },
      'max' : {
        configurable:true,
        get : function() { return max },
        set : function(v) { max = v; target.object[ target.Name ].mapping.outputMax = max }
      },
    })
    
    target.object[ target.Name ].mappingObjects = []
    
    Gibber.createProxyProperty( target.object[ target.Name ], 'min', 1, 0, {
      'min':min, 'max':max, output: target.output,
      timescale: target.timescale,
      dimensions:1
    })
    
    Gibber.createProxyProperty( target.object[ target.Name ], 'max', 1, 0, {
      'min':min, 'max':max, output: target.output,
      timescale: target.timescale,
      dimensions:1
    })
    
    Object.defineProperties( from.object[ from.Name ], {
      'min' : {
        configurable:true,
        get : function() { return _min },
        set : function(v) { _min = v; target.object[ target.Name ].mapping.inputMin = _min }
      },
      'max' : {
        configurable:true,
        get : function() { return _max },
        set : function(v) { _max = v; target.object[ target.Name ].mapping.inputMax = _max }
      },
    })
    
    target.object[ target.Name ].invert = function() {
      target.object[ target.Name ].mapping.invert()
    }
    
    if( typeof target.object.mappings === 'undefined' ) target.object.mappings = []
    
    target.object.mappings.push( mapping )
    
    if( typeof from.object.mappings === 'undefined' ) from.object.mappings = []
    
    from.object.mappings.push( mapping )
    
    Gibber.defineSequencedProperty( target.object[ target.Name ], 'invert' )
    
    return mapping
  },
  
  defineSequencedProperty : function( obj, key, priority ) {
    var fnc = obj[ key ], seq, seqNumber
    
    // for( var i = obj.seq.seqs.length - 1; i >= 0; i-- ) {
    //   var s = obj.seq.seqs[ i ]
    //   if( s.key === key ) {
    //     seq = s,
    //     seqNumber = i
    //     break;
    //   }
    // }
    
    if( !obj.seq && Gibber.Audio ) {
      obj.seq = Gibber.Audio.Seqs.Seq({ doNotStart:true, scale:obj.scale, priority:priority, target:obj })
    }
    
    fnc.seq = function( v,d ) {  

      var args = {
            'key': key,
            values: $.isArray(v) || v !== null && typeof v !== 'function' && typeof v.length === 'number' ? v : [v],
            durations: $.isArray(d) ? d : typeof d !== 'undefined' ? [d] : null,
            target: obj,
            'priority': priority
          }
            
      if( typeof seq !== 'undefined' ) {
        seq.shouldStop = true
        obj.seq.seqs.splice( seqNumber, 1 )
      }
      
      obj.seq.add( args )
      
      seqNumber = obj.seq.seqs.length - 1
      seq = obj.seq.seqs[ seqNumber ]
      
      if( args.durations === null ) { obj.seq.autofire.push( seq ) }
      
      Object.defineProperties( fnc.seq, {
        values: {
          configurable:true,
          get: function() { return obj.seq.seqs[ seqNumber ].values },
          set: function(v) {
            if( !Array.isArray(v) ) {
              v = [ v ]
            }
            if( key === 'note' && obj.seq.scale ) {  
              v = makeNoteFunction( v, obj.seq )
            }
            obj.seq.seqs[ seqNumber ].values = v //.splice( 0, 10000, v )
            //Gibber.defineSequencedProperty( obj.seq.seqs[ seqNumber ].values, 'reverse' )
          }
        },
        durations: {
          configurable:true,
          get: function() { return obj.seq.seqs[ seqNumber ].durations },
          set: function(v) {
            if( !Array.isArray(v) ) {
              v = [ v ]
            }
            obj.seq.seqs[ seqNumber ].durations = v   //.splice( 0, 10000, v )
            //Gibber.defineSequencedProperty( obj.seq.seqs[ seqNumber ].durations, 'reverse' )  
          }
        },
      })
      
      //Gibber.defineSequencedProperty( obj.seq.seqs[ seqNumber ].values, 'reverse' )
      //Gibber.defineSequencedProperty( obj.seq.seqs[ seqNumber ].durations, 'reverse' )      
      
      if( !obj.seq.isRunning ) {
        obj.seq.offset = Gibber.Clock.time( obj.offset )
        obj.seq.start( true, priority )
      }
      return obj
    }
    
    fnc.seq.stop = function() { seq.shouldStop = true } 
    
    // TODO: property specific stop/start/shuffle etc. for polyseq
    fnc.seq.start = function() {
      seq.shouldStop = false
      obj.seq.timeline[0] = [ seq ]                
      obj.seq.nextTime = 0
      
      if( !obj.seq.isRunning ) { 
        obj.seq.start( false, priority )
      }
    }
  },
  
  defineRampedProperty : function( obj, _key ) {
    var fnc = obj[ _key ], key = _key.slice(1), cancel
    
    fnc.ramp = function( from, to, length ) {
      if( arguments.length < 2 ) {
        console.err( 'ramp requires at least two arguments: target and time.' )
        return
      }
      
      if( typeof length === 'undefined' ) { // if only to and length arguments
        length = to
        to = from
        from = obj[ key ]()
      }
      
      if( cancel ) cancel()
      
      if( typeof from !== 'object' ) {
        obj[ key ] = Line( from, to, length )
      }else{
        from.retrigger( to, Gibber.Clock.time( length ) )
      }
      
      cancel = future( function() {
        obj[ key ] = to
      }, length )
      
      return obj
    }
  },
  
  createProxyMethods : function( obj, methods ) {
    for( var i = 0; i < methods.length; i++ ) Gibber.defineSequencedProperty( obj, methods[ i ] ) 
  },
  
  defineProperty : function( obj, propertyName, shouldSeq, shouldRamp, mappingsDictionary, shouldUseMappings, priority, useOldGetter ) {
    var originalValue = typeof obj[ propertyName ] === 'object' ? obj[ propertyName ].valueOf() : obj[ propertyName ],
        Name = propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 ),
        property = function( v ) {
          var returnValue = property
          
          if( v ) { 
            obj[ propertyName ] = v
            returnValue = obj
          }
          
          return returnValue
        }

    // TODO: get rid of this line
    mappingsDictionary = shouldUseMappings ? mappingsDictionary || obj.mappingProperties[ propertyName ] : null
    
    $.extend( property, mappingsDictionary )
    
    $.extend( property, {
      'propertyName': propertyName, // can't redfine 'name' on a function, unless we eval or something...
      'Name':   Name,  
      value:    originalValue,
      type:     'property',
      object:   obj,
      targets:  [],
      valueOf:  function() { return property.value },
      toString: function() { return property.value.toString() },
      oldSetter: obj.__lookupSetter__( propertyName ),
      oldGetter: obj.__lookupGetter__( propertyName ),      
      oldMappingObjectGetter: obj.__lookupGetter__( Name ),
      oldMappingObjectSetter: obj.__lookupSetter__( Name )
    })
    
    Object.defineProperty( obj, propertyName, {
      configurable:true,
      get: function(){ 
        // var returnValue = property
        // if( useOldGetter ) {
        //   console.log( property.oldGetter )
        //   returnValue = property.oldGetter()
        // }
        // else if( property.oldMappingObjectGetter ) {
        //   return property.oldMappingObjectGetter()
        // }
        // return returnValue || property
        return property
      },
      set: function( v ){
        if( (typeof v === 'function' || typeof v === 'object' && v.type === 'mapping') && ( v.type === 'property' || v.type === 'mapping' ) ) {
          //console.log( "CREATING MAPPING", property )
          Gibber.createMappingObject( property, v )
        }else{
          if( shouldUseMappings && obj[ property.Name ] ) {
            if( typeof obj[ property.Name ].mapping !== 'undefined' ) { 
              if( obj[ property.Name ].mapping.remove ) obj[ property.Name ].mapping.remove( true )
            }
          }
          
          var newValue = v
        
          if( property.oldSetter ) {
            var setterResult = property.oldSetter.call( obj, v )
            if( typeof setterResult !== 'undefined' ) { newValue = setterResult }
          }
          
          property.value = newValue
        }
        
        return obj
      }
    })
    
    if( shouldSeq  ) Gibber.defineSequencedProperty( obj, propertyName, priority )
    if( shouldRamp ) Gibber.defineRampedProperty( obj, propertyName )
    
    // capital letter mapping sugar
    if( shouldUseMappings ) {
      Object.defineProperty( obj, property.Name, {
        configurable: true,
        get : function()  {
          if( typeof property.oldMappingObjectGetter === 'function' ) property.oldMappingObjectGetter()
          return property
        },
        set : function( v ) {
          obj[ property.Name ] = v
          if( typeof mapping.oldMappingObjectSetter === 'function' ) mapping.oldMappingObjectSetter( v )
        }
      })
    }
  },
  
  createProxyProperty: function( obj, _key, shouldSeq, shouldRamp, dict, _useMappings, priority ) {
    _useMappings = _useMappings === false ? false : true
    
    Gibber.defineProperty( obj, _key, shouldSeq, shouldRamp, dict, _useMappings, priority )
  },
  
  // obj, _key, shouldSeq, shouldRamp, dict, _useMappings, priority
  createProxyProperties : function( obj, mappingProperties, noSeq, noRamp ) {
    var shouldSeq = typeof noSeq === 'undefined' ? true : noSeq,
        shouldRamp = typeof noRamp === 'undefined' ? true : noRamp
    
    obj.gibber = true // keyword identifying gibber object, needed for notation parser    
    
    obj.mappingProperties = mappingProperties
    obj.mappingObjects = []
    
    for( var key in mappingProperties ) {
      if( ! mappingProperties[ key ].doNotProxy ) {
        Gibber.createProxyProperty( obj, key, shouldSeq, shouldRamp, mappingProperties[ key ] )
      }
    }
  },  
}

Gibber.Utilities = require( './utilities' )( Gibber )
// Gibber.Audio     = require( 'gibber.audio.lib/scripts/gibber/audio' )( Gibber )
// Gibber.Graphics  = require( 'gibber.graphics.lib/scripts/gibber/graphics/graphics' )( Gibber )
// Gibber.Interface = require( 'gibber.interface.lib/scripts/gibber/interface/interface' )( Gibber )
Gibber.mappings  = require( './mappings' )( Gibber )

module.exports = Gibber

})()
},{"./dollar":"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/dollar.js","./mappings":"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/mappings.js","./utilities":"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/utilities.js"}],"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/mappings.js":[function(require,module,exports){
module.exports = function( Gibber ) {  
  var mappings = {
    audio : {
      graphics: function( target, from ) {
				if( typeof from.object.track === 'undefined' ) from.object.track = {}
				
        var proxy = typeof from.object.track[ from.propertyName ] !== 'undefined' ? from.object.track[ from.propertyName ] : new Gibber.Audio.Core.Proxy2( from.object, from.propertyName ),
            op    = new Gibber.Audio.Core.OnePole({ a0:.005, b1:.995 }),
            mapping
        
        from.object.track = proxy;

        mapping = target.object[ target.Name ].mapping = Gibber.Audio.Core.Binops.Map( proxy, target.min, target.max, from.min, from.max, target.output, from.wrap ) 
        
        op.input = mapping
        
        target.object[ target.propertyName ] = op
        
        mapping.proxy = proxy
        mapping.op = op
        
        mapping.remove = function( doNotSet ) {
          if( !doNotSet ) {
            target.object[ target.propertyName ] = target.object[ target.Name ].mapping.getValue()
          }
          
          delete target.object[ target.Name ].mapping
        }
        
        return mapping
      },
      interface: function( target, from ) {
        // TODO: why does the proxy track from.name instead of from.propertyName? maybe because interface elements don't get passed to mapping init?
        var proxy = typeof from.track !== 'undefined' ? from.track : new Gibber.Audio.Core.Proxy2( from.object, from.name ),
            op    = new Gibber.Audio.Core.OnePole({ a0:.005, b1:.995 }),
            range = target.max - target.min,
            percent = ( target.object[ target.propertyName ] - target.min ) / range,
            widgetValue = from.min + ( ( from.max - from.min ) * percent ),
            mapping
                
        if( from.object.setValue ) from.object.setValue( widgetValue )
        
        from.track = proxy
        
        mapping = target.object[ target.Name ].mapping = Gibber.Audio.Core.Binops.Map( proxy, target.min, target.max, from.min, from.max, target.output, from.wrap ) 
        
        op.input = mapping
        target.object[ target.propertyName ] = op
        
        mapping.proxy = proxy
        mapping.op = op

        mapping.remove = function( doNotSet ) {
          if( !doNotSet ) target.object[ target.propertyName ] = mapping.getValue()
          
          //if( mapping.op ) mapping.op.remove()
          
          delete mapping
        }
        
        if( typeof from.object.label !== 'undefined' ) { 
          var labelString = ''
          for( var i = 0; i < from.targets.length; i++ ) {
            var __target = from.targets[ i ]
            labelString += __target[0].object.name + '.' + __target[1]
            if( i !== from.targets.length - 1 ) labelString += ' & '
          }
          from.object.label = labelString
        }
                
        mapping.replace = function( replacementObject, key, Key  ) {
          proxy.setInput( replacementObject )
          if( replacementObject[ Key ].targets.indexOf( target ) === -1 ) replacementObject[ Key ].targets.push( [target, target.Name] )
        }
        
        return mapping
      },
      audio: function( target, from ) {
        var proxy, mapping
        
        if( typeof from.object.track !== 'undefined' ) {
          proxy = from.object.track
          proxy.count++
        } else {
          proxy = new Gibber.Audio.Core.Proxy2( from.object, from.propertyName )
          proxy.count = 1
        }
        from.object.track = proxy
        
        target.object[ target.propertyName ] = Gibber.Audio.Core.Binops.Map( proxy, target.min, target.max, from.min, from.max )
        
        mapping = target.object[ target.Name ].mapping = target.object[ target.propertyName ] // must call getter function explicitly
        
        mapping.remove = function( doNotSet ) {
          if( !doNotSet ) {
            target.object[ target.propertyName ] = mapping.getValue()
          }
          
          if( mapping.op ) mapping.op.remove()
          
          delete target.object[ target.Name ].mapping
        }
        
        mapping.replace = function( replacementObject, key, Key ) {
          var proxy = new Gibber.Audio.Core.Proxy2( replacementObject, key )
          mapping.input = proxy
          if( replacementObject[ Key ].targets && replacementObject[ Key ].targets.indexOf( target ) === -1 ) {
            replacementObject[ Key ].targets.push( [target, target.Name] )
          }
        }
        
        return mapping
      },
      audioOut : function( target, from ) {
        var mapping
        
        mapping = Gibber.Audio.Core.Binops.Map( null, target.min, target.max, 0, 1, 0 )
        
        target.object[ target.propertyName ] = target.object[ target.Name ].mapping = mapping
        
        if( typeof from.object.track !== 'undefined' ) {
          mapping.follow = from.object.track
          mapping.follow.count++
        } else {
          mapping.follow = new Gibber.Audio.Analysis.Follow({ input:from.object, useAbsoluteValue: true })
          mapping.follow.count = 1
        }
        
        from.object.track = mapping.input = mapping.follow
        
        mapping.remove = function( doNotSet ) {
          if( !doNotSet ) {
            target.object[ target.propertyName ] = target.object[ target.Name ].mapping.getValue()
          }
          
          if( mapping.bus )
            mapping.bus.disconnect()
          
          if( mapping.follow ) {
            mapping.follow.count--
            if( mapping.follow.count === 0) {
              delete from.object.track
              mapping.follow.remove()
            }
          }
          
          delete target.object[ target.Name ].mapping
        }
        
        mapping.replace = function( replacementObject, key, Key  ) {
          mapping.follow.input = replacementObject   
          if( replacementObject[ Key ].targets.indexOf( target ) === -1 ) replacementObject[ Key ].targets.push( [target, target.Name] )            
        }
      
        var env = mapping.follow.bufferSize
        Object.defineProperty( target.object[ target.Name ], 'env', {
          configurable:true,
          get: function() { return env },
          set: function(v) { env = Gibber.Clock.time( v ); mapping.follow.bufferSize = env; }
        })
                
        return mapping
      }
    },
    graphics: {
      graphics: function( target, from ) {
        // rewrite getValue function of Map object to call Map callback and then return appropriate value
        var map = Gibber.Audio.Core.Binops.Map( from.object[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap ),
            old = map.getValue.bind( map ),
            mapping
        
        map.getValue = function() {
          //console.log( from.propertyName, from, target.min, target.max, from.min, from.max )
          map.callback( from.object[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap )
          return old()
        }
        
        mapping = target.object[ target.Name ].mapping = map
        
        if( target.object.mod ) { // second case accomodates modding individual [0][1][2] properties fo vectors
          target.object.mod( target.propertyName, mapping, '=' )
        }else{
          target.modObject.mod( target.modName, mapping, '=' )
        }
        
        mapping.remove = function() {
          if( target.object.mod ) {
            target.object.removeMod( target.propertyName )
          }else{
            target.modObject.removeMod( target.modName )
          }
          target.object[ target.propertyName ] = target.object[ target.Name ].mapping.getValue()
          
          delete target.object[ target.Name ].mapping
        }
        
        mapping.replace = function( replacementObject, key, Key  ) { mapping.input = replacementObject }
        
        return mapping
      },
      interface: function( target, from ) {
        // console.log( "FROM", from.propertyName, target.min, target.max, from.min, from.max )
        var _map = Gibber.Audio.Core.Binops.Map( from.object[ from.name ], target.min, target.max, from.min, from.max, target.output, from.wrap ),
            mapping
            
        if( typeof from.object.functions === 'undefined' ) {
          from.object.functions = {}
          from.object.onvaluechange = function() {
            for( var key in from.object.functions ) {
              from.object.functions[ key ]()
            }
          }
        }

        mapping = target.object[ target.Name ].mapping = _map

        target.mapping.from = from
        
        var fcn_name = target.propertyName + ' <- ' + from.object.propertyName + '.' + from.Name

        from.object.functions[ fcn_name ] = function() {
          var val = mapping.callback( from.object[ from.name ], target.min, target.max, from.min, from.max, target.output, from.wrap )
          // target.object[ target.Name ].value = val
          // console.log( target.Name )
          target.object[ target.Name ].oldSetter.call( target.object[ target.Name ], val )
        }
        // from.object.onvaluechange = function() {          
        //   var val = map.callback( this[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap )
        //   target.object[ target.propertyName ] = val
        // }
        mapping.replace = function() {
          // var old = from.functions[ target.Name ]
        } 
        
        mapping.remove  = function() {
          console.log( "mapping removed" )
          delete from.object.functions[ fcn_name ]
        } 
        
        if( from.object.setValue ) 
          from.object.setValue( target.object[ target.propertyName ] )
        
        // if( typeof from.object.label !== 'undefined' ) {
        //   from.object.label = target.object.propertyName + '.' + target.Name
        // }
        if( typeof from.object.label !== 'undefined' ) { 
          var labelString = ''
          for( var i = 0; i < from.targets.length; i++ ) {
            var __target = from.targets[ i ]
            labelString += __target[0].object.propertyName + '.' + __target[1]
            if( i !== from.targets.length - 1 ) labelString += ' & '
          }
          from.object.label = labelString
        }
        
        return mapping
      },
      audio: function( target, from ) {
        var mapping
        
        mapping = target.object[ target.Name ].mapping = Gibber.Audio.Core.Binops.Map( null, target.min, target.max, from.min, from.max, target.output, from.wrap )
      
        mapping.follow = typeof from.object.track !== 'undefined' ? from.object.track : new Gibber.Audio.Core.Follow({ input:from.object[ from.propertyName ], useAbsoluteValue: false })
        
        from.object.track = target.object[ target.Name ].mapping.follow
        // assign input after Map ugen is created so that follow can be assigned to the mapping object
        mapping.input = mapping.follow
      
        mapping.bus = new Gibber.Audio.Core.Bus2({ amp:0 }).connect()

        mapping.connect( mapping.bus )
        
        mapping.replace = function( replacementObject, key, Key ) {
          mapping.follow.input = replacementObject            
          if( replacementObject[ Key ].targets.indexOf( target ) === -1 ) replacementObject[ Key ].targets.push( [target, target.Name] )
        }
        
        var env = mapping.follow.bufferSize
        Object.defineProperty( target.object[ target.Name ], 'env', {
          get: function() { return env },
          set: function(v) { env = Gibber.Clock.time( v ); mapping.follow.bufferSize = env; }
        })
        
        if( target.object.mod ) { // second case accomodates modding individual [0][1][2] properties fo vectors
          //console.log( target.object, target.object.mod )
          target.object.mod( target.propertyName, mapping, '=' )
        }else{
          target.modObject.mod( target.modName, mapping, '=' )
        }
        
        mapping.remove = function() {
          this.bus.disconnect()
          
          if( this.follow ) {
            this.follow.count--
            if( this.follow.count === 0) {
              delete from.object.track
              this.follow.remove()
            }
          }

          if( target.object.mod ) {
            target.object.removeMod( target.propertyName )
          }else{
            target.modObject.removeMod( target.modName )
          }
          
          delete target.object[ target.Name ].mapping
        }
        
        return mapping
      },
      audioOut : function( target, from ) {
        if( typeof target.object[ target.Name ].mapping === 'undefined') {
          var mapping = target.object[ target.Name ].mapping = Gibber.Audio.Core.Binops.Map( null, target.min, target.max, 0, 1, 0 )   
          if( typeof from.object.track !== 'undefined' ) {
            mapping.follow = from.object.track
            mapping.follow.count++
          } else {
            mapping.follow = new Gibber.Audio.Core.Follow({ input:from.object })
            mapping.follow.count = 1
          }
          from.object.track = mapping.follow
          
          var env = mapping.follow.bufferSize
          Object.defineProperty( target.object[ target.Name ], 'env', {
            configurable: true,
            get: function() { return env },
            set: function(v) { env = Gibber.Clock.time( v ); mapping.follow.bufferSize = env; }
          })
          
          mapping.input = mapping.follow
          mapping.bus = new Gibber.Audio.Core.Bus2({ amp:0 }).connect()
          mapping.connect( mapping.bus )
        
          mapping.replace = function( replacementObject, key, Key  ) {
            // _console.log( key, replacementObject )
            
            // what if new mapping isn't audio type?
            if ( replacementObject[ Key ].timescale === from.timescale ) {
              var idx = mapping.follow.input[ from.Name ].targets.indexOf( target )
              if( idx >= -1 ) {
                mapping.follow.input[ from.Name ].targets.splice( idx, 1 )
              }
            
              mapping.follow.input = replacementObject   
              if( replacementObject[ Key ].targets.indexOf( target ) === -1 ) replacementObject[ Key ].targets.push( [target, target.Name] )            
            }else{
              mapping.bus.disconnect()
              mapping.follow.remove()
              Gibber.createMappingObject( target, replacementObject )
            }
            
          }
        }else{
          console.log("REPLACING MAPPING")
          mapping.replace( from.object, from.propertyName, from.Name )
          return mapping
        }
        
        if( target.object.mod ) { // second case accomodates modding individual [0][1][2] properties of vectors
          //console.log( target.object, target.object.mod )
          target.object.mod( target.propertyName, mapping, '=' )
        }else if (target.modObject) {
          target.modObject.mod( target.modName, mapping, '=' )
        }else{
          !function() {
            var _mapping = mapping
            target.object.update = function() { 
              target.object[ target.propertyName ]( _mapping.getValue() )
            }
          }()
          //target.object.mod( target.propertyName, mapping, '=' ) 
        }
        
        //target.object[ target.Name ].mapping = mapping
        
        mapping.remove = function() {
          this.bus.disconnect()
          
          if( this.follow ) {
            this.follow.count--
            if( this.follow.count === 0) {
              delete from.object.track
              this.follow.remove()
            }
          }

          if( target.object.mod ) {
            target.object.removeMod( target.propertyName )
          }else if( target.modObject ) {
            target.modObject.removeMod( target.modName )
          }else{
            console.log( 'removing update ')
            //target.object.update = function() {}
          }
          
          target.object.mappings.splice( target.object.mappings.indexOf( mapping ), 1 )
          from.object.mappings.splice( from.object.mappings.indexOf( mapping ), 1 ) 
          
          var targets = target.object[ target.Name ].targets,
              idx = targets.indexOf( mappings )
          
          if( idx !== -1 ) {
            targets.splice( idx, 1 )
          }
          
          delete target.object[ target.Name ].mapping
        }
        return mapping
      }
    },
    notation: {
      graphics: function( target, from ) {
        // rewrite getValue function of Map object to call Map callback and then return appropriate value

        var map = Gibber.Audio.Core.Binops.Map( from.object[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap ),
            old = map.getValue.bind( map ),
            mapping
        
        map.getValue = function() {
          map.callback( from.object[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap )
          return old()
        }
        
        mapping = target.object[ target.Name ].mapping = map
        
        if( target.object.mod ) { // second case accomodates modding individual [0][1][2] properties fo vectors
          target.object.mod( target.propertyName, mapping, '=' )
        }else{
          target.modObject.mod( target.modName, mapping, '=' )
        }
        
        mapping.remove = function() {
          if( target.object.mod ) {
            target.object.removeMod( target.propertyName )
          }else{
            target.modObject.removeMod( target.modName )
          }
          target.object[ target.propertyName ] = target.object[ target.Name ].mapping.getValue()
          
          delete target.object[ target.Name ].mapping
        }
        
        mapping.replace = function( replacementObject, key, Key  ) { mapping.input = replacementObject }
        
        return mapping
      },
      interface: function( target, from ) {
        // console.log( "FROM", from.propertyName, target.min, target.max, from.min, from.max )
        var _map = Gibber.Audio.Core.Binops.Map( from.object[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap ),
            mapping
            
        if( typeof from.object.functions === 'undefined' ) {
          from.object.functions = {}
          from.object.onvaluechange = function() {
            for( var key in from.object.functions ) {
              from.object.functions[ key ]()
            }
          }
        }

        mapping = target.object[ target.Name ].mapping = _map

        target.mapping.from = from
        
        var fcn_name = target.propertyName + ' <- ' + from.object.propertyName + '.' + from.Name

        from.object.functions[ fcn_name ] = function() {
          var val = mapping.callback( from.object[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap )
          // target.object[ target.Name ].value = val
          // console.log( target.Name )
          target.object[ target.Name ].oldSetter.call( target.object[ target.Name ], val )
        }
        // from.object.onvaluechange = function() {          
        //   var val = map.callback( this[ from.propertyName ], target.min, target.max, from.min, from.max, target.output, from.wrap )
        //   target.object[ target.propertyName ] = val
        // }
        mapping.replace = function() {
          // var old = from.functions[ target.Name ]
        } 
        
        mapping.remove  = function() {
          console.log( "mapping removed" )
          delete from.object.functions[ fcn_name ]
        } 
        
        if( from.object.setValue ) 
          from.object.setValue( target.object[ target.propertyName ] )
        
        // if( typeof from.object.label !== 'undefined' ) {
        //   from.object.label = target.object.propertyName + '.' + target.Name
        // }
        if( typeof from.object.label !== 'undefined' ) { 
          var labelString = ''
          for( var i = 0; i < from.targets.length; i++ ) {
            var __target = from.targets[ i ]
            labelString += __target[0].object.propertyName + '.' + __target[1]
            if( i !== from.targets.length - 1 ) labelString += ' & '
          }
          from.object.label = labelString
        }
        
        return mapping
      },
      audio: function( target, from ) {
        var mapping
        
        mapping = target.object[ target.Name ].mapping = Gibber.Audio.Core.Binops.Map( null, target.min, target.max, from.min, from.max, target.output, from.wrap )
  
        if( typeof from.object.track !== 'undefined' && from.object.track.input === from.object.properties[ from.propertyName ] ) {
          mapping.follow = from.object.track
          mapping.follow.count++
        }else{
          mapping.follow = new Gibber.Audio.Core.Follow({ input:from.object.properties[ from.propertyName ], useAbsoluteValue: false })
          mapping.follow.count = 1
        }
        
        from.object.track = target.object[ target.Name ].mapping.follow
        
        // assign input after Map ugen is created so that follow can be assigned to the mapping object
        mapping.input = mapping.follow
      
        mapping.bus = new Gibber.Audio.Core.Bus2({ amp:0 }).connect()

        mapping.connect( mapping.bus )
        
        mapping.replace = function( replacementObject, key, Key ) {
          mapping.follow.input = replacementObject            
          if( replacementObject[ Key ].targets.indexOf( target ) === -1 ) replacementObject[ Key ].targets.push( [target, target.Name] )
        }
        
        var env = mapping.follow.bufferSize
        Object.defineProperty( target.object[ target.Name ], 'env', {
          get: function() { return env },
          set: function(v) { env = Gibber.Clock.time( v ); mapping.follow.bufferSize = env; }
        })
        
        mapping.update = function() {   
          target.object[ target.propertyName ]( mapping.getValue() )
        }
        mapping.text = target.object

        // let Notation object handle scheduling updates
        Gibber.Environment.Notation.add( mapping )
        
        mapping.remove = function() {
          this.bus.disconnect()
          
          if( this.follow ) {
            this.follow.count--
            if( this.follow.count === 0) {
              delete from.object.track
              this.follow.remove()
            }
          }
          
          Gibber.Environment.Notation.remove( mapping )
          
          delete target.object[ target.Name ].mapping
        }
        
        return mapping
      },
      audioOut : function( target, from ) {
        if( typeof target.object[ target.Name ].mapping === 'undefined') {
          var mapping = target.object[ target.Name ].mapping = Gibber.Audio.Core.Binops.Map( null, target.min, target.max, 0, 1, 0 )
          
          console.log( "MAPPING", from )
          
          if( typeof from.object.track !== 'undefined' && from.object.track.input === from.object.properties[ from.propertyName ] ) {
            mapping.follow = from.object.track
            mapping.follow.count++
          }else{
            mapping.follow = new Gibber.Audio.Core.Follow({ input:from.object, useAbsoluteValue: true })
            mapping.follow.count = 1
          }
          
          from.object.track = mapping.follow
          
          var env = mapping.follow.bufferSize
          Object.defineProperty( target.object[ target.Name ], 'env', {
            configurable:true,
            get: function() { return env },
            set: function(v) { env = Gibber.Clock.time( v ); mapping.follow.bufferSize = env; }
          })
          
          mapping.input = mapping.follow
          mapping.bus = new Gibber.Audio.Core.Bus2({ amp:0 }).connect()
          mapping.connect( mapping.bus )
        
          mapping.replace = function( replacementObject, key, Key  ) {
            // _console.log( key, replacementObject )
            
            // what if new mapping isn't audio type?
            if ( replacementObject[ Key ].timescale === from.timescale ) {
              var idx = mapping.follow.input[ from.Name ].targets.indexOf( target )
              if( idx >= -1 ) {
                mapping.follow.input[ from.Name ].targets.splice( idx, 1 )
              }
            
              mapping.follow.input = replacementObject   
              if( replacementObject[ Key ].targets.indexOf( target ) === -1 ) replacementObject[ Key ].targets.push( [target, target.Name] )            
            }else{
              mapping.bus.disconnect()
              mapping.follow.remove()
              Gibber.createMappingObject( target, replacementObject )
            }
            
          }
        }else{
          mapping.replace( from.object, from.propertyName, from.Name )
          return mapping
        }
        
        mapping.update = function() {   
          target.object[ target.propertyName ]( mapping.getValue() )
        }
        mapping.text = target.object

        // let Notation object handle scheduling updates
        Gibber.Environment.Notation.add( mapping )
        
        mapping.remove = function() {
          this.bus.disconnect()
          
          if( this.follow ) {
            this.follow.count--
            if( this.follow.count === 0) {
              delete from.object.track
              this.follow.remove()
            }
          }
          
          Gibber.Environment.Notation.remove( mapping )
          
          delete target.object[ target.Name ].mapping
        }
        return mapping
      }
    },
  } 
  
  return mappings
}

module.exports.outputCurves= {
  LINEAR:0,
  LOGARITHMIC:1
}
},{}],"/Users/charlie/Documents/code/gibber.communication.lib/node_modules/gibber.core.lib/scripts/utilities.js":[function(require,module,exports){
module.exports = function( Gibber ) {

"use strict"

var soloGroup = [],
    isSoloing = false,
    $ = Gibber.dollar,
    Synths = { Presets: {} },
    Gibberish = Gibber.Audio ? Gibber.Audio.Core : null ,//require( 'gibberish-dsp' ),
    Clock = Gibber.Clock,
    rnd = Math.random,

    Utilities = {
      seq : function() {
        var arg = arguments[0],
            type = typeof arg,
            list = [],
            output = null
    
        if( type === 'object' ) {
          if( Array.isArray( arg ) ) type = 'array'
        }
    
        // switch( type ) {
        //   case 'function':
        //     output = arg
        //     break;
        //   case 'array':
        //     for( var i = 0; i < arg.length; i++ ) {
        //       var elem = arg[ i ]
        //       if( typeof )
        //     }
        //     break;
        //   default: 
        //     output = function() { return arg }
        //     break;
        // }
    
        return output
      },
      random :  function() {
        var dict = {},
            lastChosen = null;
    
        for(var i = 0; i < arguments.length; i+=2) {
          dict[ "" + arguments[i] ] = { repeat: arguments[i+1], count: 0 };
        }

        this.pick = function() {
          var value = 0, index, lastValue;
          if(this[lastChosen]) lastValue = this[lastChosen]

          if(lastChosen !== null && dict[ lastValue ].count++ <= dict[ lastValue ].repeat) {
            index = lastChosen;
            if( dict[ lastValue ].count >= dict[ lastValue ].repeat) {
              dict[ lastValue ].count = 0;
              lastChosen = null;
            };
          }else{
            index = Utilities.rndi(0, this.length - 1);
            value = this[index];
            if( typeof dict[ ""+value ] !== 'undefined' ) {
              dict[ ""+value ].count = 1;
              lastChosen = index;
            }else{
              lastChosen = null;
            }
          }
      
        	return index; // return index, not value as required by secondary notation stuff
        };
    
        return this;
      },
  
      random2 : function() {
        var dict = {},
            lastChosen = null,
            that = this;
    
        for(var i = 0; i < arguments.length; i+=2) {
          dict[ "" + arguments[i] ] = { repeat: arguments[i+1], count: 0 };
        }

        this.pick = function() {
          var value = 0, index, lastValue;
          if(that[lastChosen]) lastValue = that[lastChosen]

          if(lastChosen !== null && dict[ lastValue ].count++ <= dict[ lastValue ].repeat) {
            index = lastChosen;
            if( dict[ lastValue ].count >= dict[ lastValue ].repeat) {
              dict[ lastValue ].count = 0;
              lastChosen = null;
            };
          }else{
            index = Utilities.rndi(0, that.length - 1);
            value = that[index];
            if( typeof dict[ ""+value ] !== 'undefined' ) {
              dict[ ""+value ].count = 1;
              lastChosen = index;
            }else{
              lastChosen = null;
            }
          }
      
        	return that[ index ]; // return index, not value as required by secondary notation stuff
        }
    
        return this.pick
      },
  
      choose: function( length ) {
        var output = null
    
        if( isNaN( length ) ) length = 1
    
        if( length !== 1 ) {
          var arr = []
    
          for( var i = 0; i < length; i++ ) {
            arr[ i ] = this[ Utilities.rndi( 0, this.length - 1 ) ]
          }
      
          output = arr
        }else{
          output = this[ Utilities.rndi( 0, this.length - 1 ) ]
        }
    
      	return output;
      },

      future : function(func, time) { 
        var count = 0
        
        var __seq = Gibber.Audio.Seqs.Seq(
          function() {
            if( count === 1 ) {
              func()
              __seq.stop()
              __seq.disconnect()
            }
            count++
          }, 
          Gibber.Audio.Clock.time( time ) 
        )
    
        return function(){ __seq.stop(); __seq.disconnect(); }
      },
  
      shuffle : function( arr ) {
      	for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
      },
  
      solo : function( ugen ) {
        var args = Array.prototype.slice.call( arguments, 0 );
        if( ugen ) {
          if( isSoloing ) { Utilities.solo(); } // quick toggle on / off
      
          for( var j = 0; j < args.length; j++ ) { // check if user soloed ugen, but fx is actually feeding Master bus
            var arg = args[ j ]
            if( arg.fx.length > 0 ) { 
              args[j] = arg.fx[ arg.fx.length - 1 ] // get last fx in chain
            }
          }
      
          for(var i = 0; i < Master.inputs.length; i++) {
            //console.log( i, Master.inputs[i] )
            var idx = args.indexOf( Master.inputs[i].value ),
                _ugen = Master.inputs[i].value,
                name = _ugen.name
            
            if( idx === -1 ) {
              if( name !== 'polyseq' &&  name !== 'Seq' ) { // TODO: please, please, don't route seqs into master bus...
                Master.inputs[i]._amp = Master.inputs[i].amp
                Master.inputs[i].amp = 0//value = Mul( Master.inputs[i].value, 0 )
                soloGroup.push( Master.inputs[i] );
              }
            }
          }
          isSoloing = true;
        }else{
          for( var i = 0; i < soloGroup.length; i++ ) {
            soloGroup[i].amp = soloGroup[i]._amp
          }
          soloGroup.length = 0
          isSoloing = false;
        } 
      },
      fill : function( length, fnc ) {
        if( isNaN( length ) ) length = 16
        if( typeof fnc !== 'function' ) { fnc = Rndf() }
    
        fnc = fnc.bind( this )
    
        for( var i = 0; i < length; i++ ) {
          this[ i ] = fnc()
        }
    
        return this
      },
      merge : function() {
        var output = []
      	for( var i = 0; i < this.length; i++ ) {
          var arg = this[ i ]
          if( Array.isArray( arg ) ) {
            for( var j = 0; j < arg.length; j++ ) {
      				output.push( arg[ j ] )
            }
          }else{
            output.push( arg )
          }
        }
  
        return output
      },
      weight : function() {
        var weights = Array.prototype.slice.call( arguments, 0 )
        this.pick = function() {
          var returnValue = this[0],
              total = 0,
              _rnd = Utilities.rndf();
  
          for(var i = 0; i < weights.length; i++) {
            total += weights[i];
            if( _rnd < total ) { 
              returnValue = i;
              break;
            }
          }
          return returnValue;
        }
    
      	return this
      },
      gibberArray: function( arr ) {
        
      },
      rndf : function(min, max, number, canRepeat) {
        canRepeat = typeof canRepeat === "undefined" ? true : canRepeat;
      	if(typeof number === "undefined" && typeof min != "object") {
      		if(arguments.length == 1) {
      			max = arguments[0]; min = 0;
      		}else if(arguments.length == 2) {
      			min = arguments[0];
      			max = arguments[1];
      		}else{
      			min = 0;
      			max = 1;
      		}

      		var diff = max - min,
      		    r = Math.random(),
      		    rr = diff * r
	
      		return min + rr;
      	}else{
      		var output = [];
      		var tmp = [];
      		if(typeof number === "undefined") {
      			number = max || min.length;
      		}
		
      		for(var i = 0; i < number; i++) {
      			var num;
      			if(typeof arguments[0] === "object") {
      				num = arguments[0][rndi(0, arguments[0].length - 1)];
      			}else{
      				if(canRepeat) {
      					num = Utilities.rndf(min, max);
      				}else{
                num = Utilities.rndf(min, max);
                while(tmp.indexOf(num) > -1) {
                  num = Utilities.rndf(min, max);
                }
      					tmp.push(num);
      				}
      			}
      			output.push(num);
      		}
      		return output;
      	}
      },
  
      Rndf : function() {
        var _min, _max, quantity, random = Math.random, canRepeat;
    
        if(arguments.length === 0) {
          _min = 0; _max = 1;
        }else if(arguments.length === 1) {
          _max = arguments[0]; _min = 0;
        }else if(arguments.length === 2) {
          _min = arguments[0]; _max = arguments[1];
        }else if(arguments.length === 3) {
          _min = arguments[0]; _max = arguments[1]; quantity = arguments[2];
        }else{
          _min = arguments[0]; _max = arguments[1]; quantity = arguments[2]; canRepeat = arguments[3];
        }    
  
        return function() {
          var value, min, max, range;
    
          min = typeof _min === 'function' ? _min() : _min
          max = typeof _max === 'function' ? _max() : _max
      
          if( typeof quantity === 'undefined') {
            value = Utilities.rndf( min, max )
          }else{
            value = Utilities.rndf( min, max, quantity, canRepeat )
          }
    
          return value;
        }
      },

      rndi : function( min, max, number, canRepeat ) {
        var range;
    
        if(arguments.length === 0) {
          min = 0; max = 1;
        }else if(arguments.length === 1) {
          max = arguments[0]; min = 0;
        }else if( arguments.length === 2 ){
          min = arguments[0]; max = arguments[1];
        }else{
          min = arguments[0]; max = arguments[1]; number = arguments[2]; canRepeat = arguments[3];
        }    
  
        range = max - min
        if( range < number ) canRepeat = true
  
        if( typeof number === 'undefined' ) {
          range = max - min
          return Math.round( min + Math.random() * range );
        }else{
      		var output = [];
      		var tmp = [];
		
      		for(var i = 0; i < number; i++) {
      			var num;
      			if(canRepeat) {
      				num = Utilities.rndi(min, max);
      			}else{
      				num = Utilities.rndi(min, max);
      				while(tmp.indexOf(num) > -1) {
      					num = Utilities.rndi(min, max);
      				}
      				tmp.push(num);
      			}
      			output.push(num);
      		}
      		return output;
        }
      },

      Rndi : function() {
        var _min, _max, quantity, random = Math.random, round = Math.round, canRepeat, range;
    
        if(arguments.length === 0) {
          _min = 0; _max = 1;
        }else if(arguments.length === 1) {
          _max = arguments[0]; _min = 0;
        }else if(arguments.length === 2) {
          _min = arguments[0]; _max = arguments[1];
        }else if(arguments.length === 3) {
          _min = arguments[0]; _max = arguments[1]; quantity = arguments[2];
        }else{
          _min = arguments[0]; _max = arguments[1]; quantity = arguments[2]; canRepeat = arguments[3];
        }  
  
        range = _max - _min
        if( typeof quantity === 'number' && range < quantity ) canRepeat = true
  
        return function() {
          var value, min, max, range;
    
          min = typeof _min === 'function' ? _min() : _min
          max = typeof _max === 'function' ? _max() : _max
    
          if( typeof quantity === 'undefined') {
            value = Utilities.rndi( min, max )
          }else{
            value = Utilities.rndi( min, max, quantity, canRepeat )
          }
    
          return value;
        }
      },
      export : function( target ) {
        target.rndi = Utilities.rndi
        target.rndf = Utilities.rndf
        target.Rndi = Utilities.Rndi
        target.Rndf = Utilities.Rndf
        
        target.future = Utilities.future
        target.solo = Utilities.solo
      },
      init: function() {
        // window.solo = Utilities.solo
        // window.future = Utilities.future // TODO: fix global reference
        Array.prototype.random = Array.prototype.rnd = Utilities.random
        Array.prototype.weight = Utilities.weight
        Array.prototype.fill = Utilities.fill
        Array.prototype.choose = Utilities.choose
        // Array.prototype.Rnd = Utilities.random2
        Array.prototype.merge = Utilities.merge
      }  
    }
  
  return Utilities
}

},{}],"/Users/charlie/Documents/code/gibber.communication.lib/scripts/client/gibber/communication.js":[function(require,module,exports){
module.exports = function( Gibber ) {
  var Comm = {
    export: function( target ) {
      target.MIDI = this.MIDI
    },
    
    MIDI: require( './midi.js')( Gibber )
  }
  return Comm
}
},{"./midi.js":"/Users/charlie/Documents/code/gibber.communication.lib/scripts/client/gibber/midi.js"}],"/Users/charlie/Documents/code/gibber.communication.lib/scripts/client/gibber/midi.js":[function(require,module,exports){
module.exports = function( Gibber ) {

/* CLOCK
clock (decimal 248, hex 0xF8)
start (decimal 250, hex 0xFA)
continue (decimal 251, hex 0xFB)
stop (decimal 252, hex 0xFC)
*/

var MIDI = {
  _midi: null,
  inputs: [],
  outputs: [],
  seq: null,
  
  // TODO: only connect to desired ports somehow
  clock: function( midiOutputNumber, channelNumber ) {
    var phase = 0, totalPhase = 0,
        context = Gibber.Audio.Core.context,
        startTime = window.performance.now(),
        MIDIClock = {
          output: MIDI.outputs[ midiOutputNumber ],
          channel: channelNumber || 0,
          properties: { rate: Gibber.Clock },
          name:'midi_clock',
          callback : function( rate ) { // a rate of 1 = 120 BPM
            var ppqTime = (baseline / rate) / 24
            totalPhase++
            if( phase++ >= ppqTime ) { // * 8 ) {
              var time = startTime + totalPhase / 44.1//,
                  //ppqMS = ppqTime / 44.1
              
              phase -= ppqTime // * 8
              
              //console.log( time, ppqTime, ppqMS )
              MIDIClock.output.send( [ 248 ] )
              // MIDIClock.output.send( [ 248 ], time + ppqMS )
              // MIDIClock.output.send( [ 248 ], time + ppqMS + ppqMS )
              // MIDIClock.output.send( [ 248 ], time + ppqMS + ppqMS + ppqMS )
              // MIDIClock.output.send( [ 248 ], time + ppqMS + ppqMS + ppqMS + ppqMS )
              // MIDIClock.output.send( [ 248 ], time + ppqMS + ppqMS + ppqMS + ppqMS + ppqMS )
              // MIDIClock.output.send( [ 248 ], time + ppqMS + ppqMS + ppqMS + ppqMS + ppqMS + ppqMS )
              // MIDIClock.output.send( [ 248 ], time + ppqMS + ppqMS + ppqMS + ppqMS + ppqMS + ppqMS + ppqMS )
              
                            
            }
            return 0
          }
        },
        baseline = 22050

    MIDIClock.__proto__ = new Gibber.Audio.Core.ugen()
    MIDIClock.__proto__.init.call( MIDIClock )
    
    //console.log( MIDIClock )
    MIDIClock.connect()
    
    MIDI.Clock = MIDIClock
    
    return MIDIClock
  },
  
  readClock: function( inputNumber ) {
    this.clockMaster = inputNumber
  },
  init: function() {
    var that = this
    
    navigator.requestMIDIAccess().then( 
      function(m) { 
        console.log( "MIDI access granted.", m)
        that._midi = m;
        var inputs = that._midi.inputs.entries(), count = 0, input = null
        
        var ccMapping = { min:0, max:127, output:Gibber.outputCurves.LINEAR, timescale:'interface' }

        while( input === null || inputs.done === false ) {
          !function() {
            MIDI.inputs[ count++ ] = input = inputs.next().value[1]
            
            Object.defineProperty( that, i, {
              get: function() { return input },
              set: function() {}
            })
            
            input.onmidimessage = MIDI.parse
						input.defaultChannel = 0
            
            Object.defineProperties(input, {
              'cc' : {
                get: function() { return input.channel[ input.defaultChannel ].cc },
                set: function() {}
              },
              'target' : {
                get: function() { return input.channel[ input.defaultChannel ].target },
                set: function(v) {
                  input.channel[ input.defaultChannel ].target = v
                }
              }
            })
            
            input.channel = []
            
            for( var j = 0; j < 16; j++ ) {
              input.channel[ j ] = {
                target: null,
                cc: []
              }
              
              for( var k = 0; k < 127; k++ ) {
                input.channel[ j ].cc[ k ] = {
                  value:0,
                  type:'mapping'
                }

                Gibber.createProxyProperties( input.channel[ j ].cc[ k ], { 
                  value : ccMapping
                }, true, true )
              }
            }
          }()
        }
        
        var output = null, outputs = that._midi.outputs.entries(), count = 0

        while( output === null || outputs.done === false ) {
          MIDI.outputs[ count++ ] = output = outputs.next().value[1]
          !function() {
            var midiOutput = output
          
            output.channel = []
          
            for( var j = 0; j < 16; j++ ) {
              !function() {
                var channel = j
                output.channel[ j ] = {
                  cc: [],
                  note: function( msg ) {
                    var number = msg[0], amp = typeof msg[1] === 'undefined' ? 127 : msg[1]
                    
                    if( typeof number === 'function' ) number = number()
                    if( typeof amp === 'function' ) amp = amp()
                    midiOutput.send( [144 + channel, number, amp] )
                  }
                }
                
                Gibber.defineSequencedProperty( output.channel[ j ], 'note', false )
            
                for( var k = 0; k < 127; k++ ) {
                  output.channel[ j ].cc[ k ] = {
                    value:0,
                    type:'mapping'
                  }

                  Gibber.createProxyProperties( output.channel[ j ].cc[ k ], { 
                    value : ccMapping
                  }, true, true )
                }
              }()
            }
          }()
        }
      }.bind( this ), 
      
      function() { 
        console.log('failed to initialize midi') 
      }.bind( this ) 
    )
    
    return this
  },
  
  channels : [],
  
  types: {
    8: 'noteoff',
    9: 'noteon',
    11: 'cc',
    12: 'programchange'
  },
  
  ntof : function( noteNumber ) { return Math.pow(2,(noteNumber - 49)/12)*261.626 },
  
  log: false,
  onmessage: null,
  showInputs : function() {
    for (var i = 0; i < MIDI._midi.inputs.length; i++ ) {
      var _input = MIDI[ i ]
      console.log( "Input port " + i + " | " +
        " manufacturer:" + _input.manufacturer + ", name: " + _input.name)
    }

  },
  clockMaster: null,
  clockHistory : [],
  clockIndex : 0,
  clockAvg  : 0,
  lastReceivedTime: 0,
  clockBufferSize: 12,
  
  clockReceived: function( inputNumber, msg ) {
    if( this.clockMaster === inputNumber && this.clockIsRunning ) {
      
      if( this.lastReceivedTime === 0 ) {
        this.lastReceivedTime = msg.receivedTime
        return
      }
      var amt = msg.receivedTime - this.lastReceivedTime
      
    	this.clockAvg += amt
      this.lastReceivedTime = msg.receivedTime
      this.clockAvg -= this.clockHistory[ this.clockIndex ] || 0
      
      this.clockHistory[ this.clockIndex ] = amt
      
      this.clockIndex = ( this.clockIndex + 1 ) % this.clockBufferSize
			
    	var value = (this.clockAvg / this.clockHistory.length ),
          quarterTime = value * 24,
          timeMod = 1 / ( (quarterTime * 2 ) / 1000 )
      
      // console.log( "VALUE", value, timeMod )
      Gibber.Clock.rate = MIDI.clockRate = timeMod
    }
  },
  clockRate : 1,
  clockIsRunning: false,
  onstartmessage: function( inputNumber ) {
    if( this.clockMaster === inputNumber ) {
      console.log("MIDI CLOCK START")
      Gibber.Clock.currentBeat = 1
      Gibber.Clock.phase = 0
      Gibber.Clock.rate = MIDI.clockRate
      
      this.clockHistory.length = 0
      this.lastReceivedTime = 0
      this.clockIndex = 0
      this.clockAvg = 0
      this.clockIsRunning = true
      // if( Gibber.Clock.metronome !== null ) {
      //   Gibber.Clock.metronome.draw( Gibber.Clock.currentBeat, Gibber.Clock.signature.upper )
      // }
    }
  },
  
  oncontinuemessage: function( inputNumber ) {
    console.log("CONTINUE")
    if( this.clockMaster === inputNumber ) {
      console.log("MC CONTINUE")
    }
  },
  
  onstopmessage: function( inputNumber ) {
    console.log( "MC END" )
    if( this.clockMaster === inputNumber ) {
      console.log( "MIDI CLOCK END" )
      Gibber.Clock.rate = 0
      
      this.clockIsRunning = false
      
      // if( Gibber.Clock.metronome !== null ) {
      //   Gibber.Clock.metronome.draw( Gibber.Clock.currentBeat, Gibber.Clock.signature.upper )
      // }
    }
  },
  
  onsppmessage: function( inputNumber, msg ) {
    if( this.clockMaster === inputNumber ) {
      if( msg.data[1] === 0 && msg.data[2] === 0 ) {
        MIDI.onstartmessage( inputNumber )
      }
    }
  },
  
  processIncomingClock: function( msg, targetInput ) {
    var isClock = true
    switch( msg.data[0] ) {
      case 242: 
        MIDI.onsppmessage( targetInput, msg )
        isClock = false
        console.log( msg.data[0], msg.data[1], msg.data[2] )
        break;
      case 248:
        MIDI.clockReceived( targetInput, msg )
        break;
      case 250:
        MIDI.onstartmessage( targetInput )
        break;
      case 251:
        MIDI.oncontinuemessage( targetInput )
        break;
      case 252:
        MIDI.onstopmessage( targetInput )
        break;
      default:
        isClock = false
        break;
    }
    
    return isClock
  },
  
  parse: function( msg ) {
    var targetInput = MIDI.inputs.indexOf( msg.target )
    
    var shouldReturn = MIDI.processIncomingClock( msg, targetInput )
    if( shouldReturn ) return // msg is a clock message
    
    var msgType = MIDI.types[ Math.floor( msg.data[0] / 16 ) ],
      channel = msg.data[0] % 16,
      num = msg.data[1],
      value = typeof msg.data[2] !== 'undefined' ? msg.data[2] : 0
 		
    //console.log( "MSG received", msg )
    
    if( MIDI.log ) log( msgType, channel, num, value, targetInput )
 
    switch( msgType ) {
      case 'noteon' :
        if( MIDI.inputs[ targetInput ].channel[ channel ].target ) {
          MIDI.inputs[ targetInput ].channel[ channel ].target.note( MIDI.ntof( num ) , value / 127 )
        }
        break;
      case 'noteoff' :
        if( MIDI.inputs[ targetInput ].channel[ channel ].target ) {
          MIDI.inputs[ targetInput ].channel[ channel ].target.note( MIDI.ntof( num ) , 0 )
        }
        break;
      case 'cc' :
				MIDI.inputs[ targetInput ].channel[ channel ].cc[ num ].value( value )
        break;
    }
    
    if( MIDI.onmessage ) { MIDI.onmessage( targetInput, msgType, channel, num, value ) }
    if( MIDI.inputs[ targetInput ].onmessage ) {
      MIDI[ targetInput.onmessage( msgType, channel, num, value ) ]
    }
  }
}

return MIDI

}
},{}]},{},["./scripts/client/gibber/communication.lib.js"])("./scripts/client/gibber/communication.lib.js")
});