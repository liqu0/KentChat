# Set working directory
ResourceDir = '/projects/kentchat/'

# Import modules
Modules =
	fs: require('fs')
	https: require('https')
	sio: require('socket.io')
	sha: require('sha1')
	aes: require('aes256')
	readline: require('readline')

# Initialize modules
WebServer = https.createServer
	key: fs.readFileSync ResourceDir + 'privkey.pem'
	cert: fs.readFileSync ResourceDir + 'cert.pem'
, (req, res) ->
	res.end 'You were not supposed to visit here with a browser. Use a KentChat client!'
SIOServer = sio(WebServer)

# Declare options and variables
Options =
	verbose: true
	phRand: [97,123]
	phLength: 10

userRegistry = []
groupRegistry = []
messageRegistry = []
loggedUsers = []
hostBlacklist = JSON.parse Modules.fs.readFileSync ResourceDir + "blacklist.json"
getFileJSON = (fname) -> JSON.parse Modules.fs.readFileSync "#{ResourceDir}#{fname}.json"
GlobalDebug = yes

# Declare object types using classes
UserPowerLevels =
	guest: -100
	privileged: -50
	developer: 0
	admin: 50
	owner: 2000

class KcIdentifier
	constructor: (@id) ->

class User extends KcIdentifier
	constructor: (id, @powerLevel, @auth) ->
		super id
		@connID = null
		@cipher = Modules.aes.createCipher @auth

	isQualifiedFor: (powerLevel) -> powerLevel <= @powerLevel
	toString: () -> "[User id=#{@id} powerLevel=#{@powerLevel}]"
	onConnect: (client) ->
		@connID = client.id
		if not this in loggedUsers then loggedUsers.push this else KcCoreLogger.warn "user #{@id} onConnect called twice"
	onDisconnect: () ->
		@connID = null if @connID?
		if this in loggedUsers then loggedUsers.pop this else KCCoreLogger.warn "user #{@id} onDisconnect called twice"
	authenticate: (pwd) -> Modules.sha pwd is @auth

	send: (event, msg) ->
		throw Error "#{@toString()} Message undefined!" if not msg?
		(SIOServer.to @connID).emit event, @cipher.encrypt msg

	decipher: (msg) -> @cipher.decrypt msg
	isConnected: -> @connID isnt null

	toJSON: ->
		id: @id
		powerLevel: @powerLevel
		auth: @auth

toID = (user) -> if typeof user is 'string' then user else user.id

class Group extends KcIdentifier
	constructor: (id, owner, members, @passphrase) ->
		super id
		@owner = owner.id
		@members = if members? then (toID member for member in members) else [toID @owner]
		@passphrase ?= \
			(String.fromCharCode(Math.floor(Math.random() * \
			(Options.phRand[1] - Options.phRand[0])) + Options.phRand[0]) for _ in [1..Options.phLength]).join ''

	addUser: (user) -> @members.push user.id
	removeUser: (user) -> @members.pop user.id
	toString: () -> "[Group id=#{@id} length-of-members=#{@members.length}]"

	# send: (msg) ->
	# 	throw Error "#{@toString()} Message undefined!" if not msg?
	# 	@connection.send Modules.aes.encrypt @passphrase, msg

	toJSON: () ->
		id: @id
		passphrase: @passphrase
		members: x.id for x in @members

# Set up common functions
getUserById = (id) ->
	return user for user in userRegistry when user.id is id
getGroupById = (id) ->
	return group for group in groupRegistry when group.id is id

class Message extends KcIdentifier
	DIRECT_MESSAGE: 0
	GROUP_MESSAGE: 1

	constructor: (@type, @sourceId, @destId, @message, @read = no) ->
		if not (@type in [@DIRECT_MESSAGE..@GROUP_MESSAGE])
			throw Error "Unknown message type: #{@type}"
		@id = (String.fromCharCode(Math.floor(Math.random() * \
			(Options.phRand[1] - Options.phRand[0])) + Options.phRand[0]) for _ in [0..13]).join ''

	toJSON: () ->
		type: @type
		sourceId: @sourceId
		destId: @destId
		message: @message
		read: @read

getMessageById = (id) ->
	return msg for msg in messageRegistry when msg.id is id

class Logger
	Colors:
		reset: `'\033[0m'`
		red: `'\033[0;31m'`
		green: `'\033[0;32m'`
		yellow: `'\033[0;33m'`
		blue: `'\033[0;34m'`

	constructor: (@name, @includeTimeStamp=yes) -> @levels = []
	log: (message, prefix='', suffix='', type='log') ->
		console.log "#{prefix}#{if @includeTimeStamp then ("[" + new Date().toTimeString().substr 0,8 + "]") else ''}#{@name} #{type} -> #{level+" -> " for level in @levels}#{message}#{suffix}"
	error: (message) -> @log message, @Colors.red, @Colors.reset, 'ERROR'
	warn: (message) -> @log message, @Colors.yellow, @Colors.reset, 'WARN'
	info: (message) -> @log message, @Colors.blue, @Colors.reset, 'info'
	debug: (message) -> if GlobalDebug then @log message, @Colors.green, @Colors.reset, 'debug'
	enter: (level) -> if not (level in @levels) then @levels.push level else @warn "logger was asked to enter existent level #{level}"
	exit: (level) -> if (level in @levels) then @levels.pop level else @warn "logger was asked to exit nonexistent level #{level}"

User.fromJSON = (jsonExpression) -> new User(jsonExpression.id, jsonExpression.powerLevel, jsonExpression.auth)
Group.fromJSON = (jsonExpression) -> new Group(jsonExpression.id, getUserById userExp for userExp in jsonExpression.members, jsonExpression.passphrase)
Message.fromJSON = (je) -> new Message je.type, je.sourceId, je.destId, je.message, je.read

# Set up variables and functions that use the defined classes
userRegistry.push User.fromJSON json for json in getFileJSON 'users'
groupRegistry.push Group.fromJSON json for json in getFileJSON 'groups'
messageRegistry.push Message.fromJSON json for json in getFileJSON 'messages'

KcCoreLogger = new Logger "KentChat"
KcMessageLogger = new Logger "MessageLogger"

containsUser = (id) -> (getUserById id)?
containsGroup = (id) -> (getGroupById id)?
messagesFrom = (id) -> (msg for msg in messageRegistry when msg.sourceId is id)
messagesToUser = (id) -> (msg for msg in messageRegistry when msg.type is Message.DIRECT_MESSAGE and msg.destId is id).concat \
	(msg for msg in messageRegistry when msg.type is Message.GROUP_MESSAGE and id in (getGroupById msg.destId).members)
groupIDs = () -> (group.id for group in groupRegistry)
userIDs = () -> (user.id for group in groupRegistry)
connectionIsLoggedIn = (conn) -> if user.connID is conn.id for user in userRegistry then yes else no
getUserBySocketID = (socketID) ->
	return user for user in userRegistry when user.connID is socketID
User::unreadMessages = () -> (msg for msg in messagesToUser @id when not msg.read)
User::sentMessages = () -> messagesFrom @id
User::onRead = (message) -> (message.read = yes) if message.type is Message.DIRECT_MESSAGE and message.destId is @id and not message.read
User::sendMessage = (destId, message, type) ->
	msg = new Message type, @id, destId, message
	messageRegistry.push msg
	@send {type: "newMessage", id: msg.id}
Group::getMessages = () -> (msg for msg in messageRegistry when msg.type is Message.GROUP_MESSAGE and msg.destId is @id)

# Event handler common functions
fail = (reason) -> ['failure', reason]
succeed = (info) -> if info? then ['success', info] else ['success']
data = (raw) -> ['data', (if raw instanceof Array then raw.join ', ' else raw)]
# Event handler modules
eventHandlers = [
	{
		expectedType: "msg"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: ["dest", "message", "toUser"]
		onMessage: (msg, source) ->
			(return fail "target user or group does not exist") if (msg.toUser and not containsUser msg.dest) or (not msg.toUser and not containsGroup msg.dest)
			source.sendMessage msg.dest, msg.message, if msg.toUser then Message.DIRECT_MESSAGE else Message.GROUP_MESSAGE
			KcMessageLogger.log "message sent from #{source.toString()} to #{msg.dest}: #{msg.message}"
			return succeed()
	}
	{
		expectedType: "listUsers"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: []
		onMessage: (msg, source) -> data userIDs()
	}
	{
		expectedType: "read"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: ["id"]
		onMessage: (msg, source) ->
			message = getMessageById msg.id
			if message? and message.destId is source.id
				source.onRead message
				return data
					read: yes
					sender: message.sourceId
					message: message.message
			else return data
				read: no
				why: 'message does not exist or is unaccessible'
	}
	{
		expectedType: "getUnread"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: []
		onMessage: (msg, source) -> data(message.id for message in source.unreadMessages())
	}
	{
		expectedType: "createGroup"
		expectedPerm: UserPowerLevels.admin
		expectedArgs: ["id"]
		onMessage: (msg, source) ->
			if msg.id in groupIDs()
				return fail 'this group already exists'
			else
				groupRegistry.push new Group msg.id, [source.id]
				return succeed "group #{msg.id} created"
	}
	{
		expectedType: "listGroups"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: []
		onMessage: (msg, source) -> data groupIDs()
	}
	{
		expectedType: "inviteToGroup"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: ['target', 'group']
		onMessage: (msg, source) ->
			(return fail "group #{msg.group} does not exist") if not msg.group in groupIDs()
			source.sendMessage msg.target, "I invite you to join the group named #{msg.group}. \
				Use \"kc.join('#{msg.group}')\" to join. (generated by KentChat)", Message.DIRECT_MESSAGE
			return succeed "invitation sent"
	}
	{
		expectedType: "joinGroup"
		expectedPerm: UserPowerLevels.guest
		expectedArgs: ['target']
		onMessage: (msg, source) ->
			(return fail "group #{msg.group} does not exist") if not msg.target in groupIDs()
			group = getGroupById msg.target
			(return fail "you are already in this group") if source.id in group.members
			group.addUser source
			return succeed "you have joined #{group.id}"
	}
	{
		expectedType: "register"
		expectedPerm: UserPowerLevels.admin
		expectedArgs: ['id', 'auth', 'powerLevel']
		onMessage: (msg, source) ->
			(return fail "#{msg.id} exists") if containsUser source.id
			userRegistry.push new User msg.id, msg.powerLevel, Modules.sha msg.auth
			return succeed "#{msg.id} created"
	}
]
KcCoreLogger.debug "Declared #{eventHandlers.length} event handlers"

# Login procedure
SIOServer.on 'connection', (socket) ->
	socket.on 'login', (data) ->
		if not data.id? or not data.auth?
			socket.emit 'failure', 'expected data.id and data.auth, missing'
			return
		if connectionIsLoggedIn socket
			socket.emit 'failure', 'already logged in'
			return
		user = getUserById data.id
		if not user?
			socket.emit 'failure', "unknown userID: #{data.id}"
			return
		if user.isConnected()
			socket.emit 'failure', "user #{data.id} is already logged in"
			return
		if not user.authenticate data.auth
			socket.emit 'failure', 'bad password'
			return
		user.onConnect socket
		socket.emit 'success', {}
		for handler in eventHandlers
			socket.on handler.expectedType, (data) ->
				if not connectionIsLoggedIn socket
					socket.emit 'failure', 'You are not logged in'
					socket.disconnect()
					return
				source = getUserBySocketID socket.id
				if not source.isQualifiedFor handler.expectedPerm
					source.send 'failure', "You are not qualified to '#{handler.expectedType}', \
						required power level is #{handler.expectedPerm}, you have #{source.powerLevel}"
					return
				if not data[arg]? for arg in handler.expectedArgs
					source.send 'failure', "Missing arguments; expected #{handler.expectedArgs.join ', '}"
					return
				result = handler.onMessage data, source
				if not (result instanceof Array) or result.length isnt 2
					KcCoreLogger.error "Unexpected result from #{handler.expectedType} eventHandler: #{result}, expected 2-element array"
					source.send 'failure', 'Server internal error, please report to the owners'
					return
				source.send result[0], result[1]
	socket.on 'disconnect', ->
		source = getUserBySocketID socket.id
		source.onDisconnect() if source?
