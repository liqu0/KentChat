# Set working directory
ResourceDir = '/projects/kentchat/'

# Import modules
Modules =
	fs: require('fs')
	https: require('https')
	wss: require('websocket').server
	sha: require('sha1')
	aes: require('aes256')
	readline: require('readline')

# Initialize modules
WebServer = https.createServer
	key: fs.readFileSync ResourceDir + 'privkey.pem'
	cert: fs.readFileSync ResourceDir + 'cert.pem'
, (req, res) ->
	res.end 'You were not supposed to visit here with a browser. Use a KentChat client!'
WSServer = new Modules.wss
	httpServer: WebServer

# Declare options and variables
Options =
	verbose: true
	phRand: [97,123]
	phLength: 10

userRegistry = []
groupRegistry = []
loggedUsers = []
hostBlacklist = JSON.parse Modules.fs.readFileSync ResourceDir + "blacklist.json"

# Declare object types using classes
UserPowerLevels =
	guest: -100
	privileged: -50
	developer: 0
	admin: 50
	owner: 2000

class User
	constructor: (@id, @powerLevel, @auth) ->
		@connection = null
		@cipher = Modules.aes.createCipher @auth

	isQualifiedFor: (powerLevel) -> powerLevel <= @powerLevel
	toString: () -> "[User id=#{@id} powerLevel=#{@powerLevel}]"
	onConnect: (webSocketConnection) -> @connection = webSocketConnection
	onDisconnect: () -> @connection = null if @connection?
	authenticate: (pwd) -> Modules.sha pwd is @auth

	send: (msg) ->
		throw Error "#{@toString()} Message undefined!" if not msg?
		@connection.send @cipher.encrypt msg

	isConnected: () -> @connection isnt null

	toJSON: () ->
		id: @id
		powerLevel: @powerLevel
		auth: @auth

class Group
	constructor: (@id, member, passphrase) ->
		@members = member or []
		@passphrase = if passphrase? \
			then passphrase else \
			(String.fromCharCode(Math.floor(Math.random() * \
			(Options.phRand[1] - Options.phRand[0])) + Options.phRand[0]) for _ in [0..Options.phLength]).join ''

	addUser: (user) ->
		@members.push user
		loggedUsers.push @id

	removeUser: (user) -> @members.push user
	toString: () -> "[Group id=#{@id} length-of-members=#{@members.length}]"

	send: (msg) ->
		throw Error "#{@toString()} Message undefined!" if not msg?
		@connection.send Modules.aes.encrypt @passphrase, msg

	toJSON: () ->
		id: @id
		passphrase: @passphrase
		members: x.id for x in @members

# Set up common functions
getUserById = (id) ->
	for user in userRegistry
		return user if user.id is id

getGroupById = (id) ->
	for group in groupRegistry
		return group if group.id is id

User.fromJSON = (jsonExpression) -> new User(jsonExpression.id, jsonExpression.powerLevel, jsonExpression.auth)
Group.fromJSON = (jsonExpression) -> new Group(jsonExpression.id, getUserById userExp for userExp in jsonExpression.members, jsonExpression.passphrase)

# Set up variables
userRegistry.push User.fromJSON json for json in JSON.parse Modules.fs.readFileSync ResourceDir + "users.json"
groupRegistry.push Group.fromJSON json for json in JSON.parse Modules.fs.readFileSync ResourceDir + "groups.json"


containsUser = (id) -> (getUserById id)?
containsGroup = (id) -> (getGroupById id)?

# Event handler modules
eventHandlers = [
	{
		expectedType: "dm"
		expectedArgs: ["dest"]
		onMessage: (msg, source) ->

	}
]
setupHandlersForUser = (conn, id) ->


# Login procedure
WSServer.on 'request', (req) ->
	if req.host in hostBlacklist
		req.reject 200, 'You are on the KentChat blacklist!'
	else
		conn = req.accept null, req.origin
		conn.on 'message', (message) ->
			if message.type is 'binary'
				conn.drop 1007, 'expected login data to be utf8, received binary'
			else if not (message.id? and message.auth?)
				conn.drop 1007, 'expected msg.id and msg.auth, missing'
			else
				user = getUserById message.id
				if not user?
					conn.drop 1003, "unknown userID: #{message.id}"
					return
				if user.isConnected()
					conn.drop 1003, "user #{message.id} is already logged in"
					return
				if not user.authenticate message.auth
					conn.drop 1003, 'bad password'
					return
				user.onConnect conn
