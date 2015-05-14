module.exports = function( Gibber ) {
  var Comm = {
    export: function( target ) {
      target._MIDI_ = this.MIDI
      target.OSC = this.OSC
    },
    
    MIDI: require( './midi.js' )( Gibber ),
    OSC:  require( './osc.js' )( Gibber )
  }
  return Comm
}