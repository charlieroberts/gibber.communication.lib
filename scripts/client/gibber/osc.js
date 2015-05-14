module.exports = function( Gibber ) {
  
var OSC = Gibber.OSC = {
  callbacks : {},
  
  init : function( port ) {
    var _port = port || 8080,
        _socket = OSC.socket = new WebSocket( 'ws://127.0.0.1:' + _port )
    
    OSC.socket.onopen = function() { console.log( 'OSC socket opened on port ' + _port + '.' ) }
    OSC.socket.onmessage = OSC.onmessage;
  },
  
  onmessage : function(msg) {
    var data
    try{
      data = JSON.parse( msg.data )
    }catch( error ) {
      console.error( "ERROR on parsing OSC msg", error )
      return
    }
    
    if( OSC.callbacks[ data.address ] ) {
      OSC.callbacks[ data.address ]( data.parameters )
    }else{
      if( OSC.callbacks[ '*' ] ) {
        data.parameters.address = data.address
        OSC.callbacks[ '*' ]( data.parameters )
      }
    }
  },
  
  send : function( address, type, params, port, ipAddress ) {
    var msg = {
      'address':address,
      'type': type.split(''),
      'parameters':params,
      'port': port,
      'ipAddress': ipAddress,
      type:'OSC'
    }
    OSC.socket.send( JSON.stringify( msg ) )
  },
}

return OSC

}