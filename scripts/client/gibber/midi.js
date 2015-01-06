!function( Gibber) {

var MIDI = {
  _midi: null,
  inputs: [],
  outputs: [],
  init: function() {
    var that = this
    
    navigator.requestMIDIAccess().then( 
      function(m) { 
        console.log( "MIDI access granted.", m)
        that._midi = m;
        var inputs = that._midi.inputs.entries()
        
        var ccMapping = { min:0, max:127, output:Gibber.outputCurves.LINEAR, timescale:'interface' }
        console.log("INPUTS", inputs )
        for( var input in inputs ) {
          !function() {
            //input = inputs[ i ]
            if( typeof input.value === 'undefined' ) return
            input = input.value
            
            Object.defineProperty( that, i, {
              get: function() { return input },
              set: function() {}
            })
            
            console.log("INPUT", input )
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

//                 Gibber.createProxyProperties( input.channel[ j ].cc[ k ], { 
//                   value : ccMapping
//                 }, true, true )
              }
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
  
  parse: function( msg ) {
    var msgType = MIDI.types[ Math.floor( msg.data[0] / 16 ) ],
      channel = msg.data[0] % 16,
      num = msg.data[1],
      value = typeof msg.data[2] !== 'undefined' ? msg.data[2] : 0,
      targetInput = MIDI.inputs.indexOf( msg.target )
 		
    //console.log( "MSG received", msg.target )
    
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
    if( MIDI[ targetInput ].onmessage ) {
      MIDI[ targetInput.onmessage( msgType, channel, num, value ) ]
    }
  }
}

module.exports = MIDI

}()