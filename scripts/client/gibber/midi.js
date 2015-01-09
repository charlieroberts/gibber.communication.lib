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