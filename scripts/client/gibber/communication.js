module.exports = function( Gibber ) {
  var Comm = {
    export: function( target ) {
      target.MIDI = this.MIDI
    },
    
    MIDI: require( './midi.js')( Gibber )
  }
  return Comm
}