const PROTOCOL_VERSION = 1;
const JOIN_PARAM = 'missionJoin';

function createMessage(type, payload = {}) {
  return {
    type,
    protocolVersion: PROTOCOL_VERSION,
    messageId: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    sentAt: new Date().toISOString(),
    payload
  };
}

function safeSend(conn, message) {
  if (!conn?.open) return false;
  try {
    conn.send(message);
    return true;
  } catch (error) {
    return false;
  }
}

function getJoinUrl(peerId) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(JOIN_PARAM, peerId);
  return url.toString();
}

export function getMissionJoinCodeFromUrl() {
  return new URL(window.location.href).searchParams.get(JOIN_PARAM) || '';
}

export function extractMissionJoinCode(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.href);
    return url.searchParams.get(JOIN_PARAM) || raw;
  } catch (error) {
    return raw.replace(/^#?missionJoin=/i, '').trim();
  }
}

export function renderMissionQrCode(element, text) {
  if (!element) return;
  element.innerHTML = '';
  if (typeof window.QRCode !== 'function') {
    element.textContent = text;
    return;
  }
  new window.QRCode(element, {
    text,
    width: 168,
    height: 168,
    colorDark: '#111827',
    colorLight: '#ffffff',
    correctLevel: window.QRCode.CorrectLevel?.M
  });
}

export function createMissionHostSession(callbacks = {}) {
  if (typeof window.Peer !== 'function') {
    callbacks.onError?.('PeerJS indisponivel.');
    return null;
  }

  const peers = new Map();
  const peer = new window.Peer();
  const session = {
    peer,
    id: '',
    joinUrl: '',
    players: [],
    sendToPlayer(playerId, type, payload = {}) {
      const entry = peers.get(playerId);
      return safeSend(entry?.conn, createMessage(type, payload));
    },
    broadcast(type, payload = {}) {
      peers.forEach(entry => safeSend(entry.conn, createMessage(type, payload)));
    },
    close() {
      peers.forEach(entry => entry.conn?.close?.());
      peer.destroy?.();
      peers.clear();
      session.players = [];
    }
  };

  function publishRoster() {
    callbacks.onPlayersChanged?.([...session.players]);
  }

  function attach(conn) {
    let playerId = '';
    conn.on('data', message => {
      if (message?.type === 'PLAYER_JOINED') {
        if (session.players.length >= 8) {
          safeSend(conn, createMessage('ERROR', { code: 'ROOM_FULL', message: 'Sala cheia.' }));
          return;
        }
        const name = String(message.payload?.playerName || '').trim().slice(0, 28);
        if (!name) {
          safeSend(conn, createMessage('ERROR', { code: 'INVALID_NAME', message: 'Nome invalido.' }));
          return;
        }
        playerId = `player_${session.players.length + 1}`;
        const player = { id: playerId, name, deviceId: conn.peer };
        session.players = [...session.players, player];
        peers.set(playerId, { conn, player });
        safeSend(conn, createMessage('PLAYER_JOINED', { player }));
        publishRoster();
        callbacks.onPlayerJoined?.(player);
        return;
      }
      if (!playerId || !peers.has(playerId)) {
        safeSend(conn, createMessage('ERROR', { code: 'PLAYER_NOT_BOUND', message: 'Jogador nao vinculado.' }));
        return;
      }
      callbacks.onMessage?.(message, peers.get(playerId).player);
    });
    conn.on('close', () => {
      if (!playerId) return;
      peers.delete(playerId);
      session.players = session.players.map(player => (
        player.id === playerId ? { ...player, connected: false } : player
      ));
      publishRoster();
      callbacks.onPlayerDisconnected?.(playerId);
    });
  }

  peer.on('open', id => {
    session.id = id;
    session.joinUrl = getJoinUrl(id);
    callbacks.onOpen?.(session);
  });
  peer.on('connection', attach);
  peer.on('error', error => callbacks.onError?.(error?.message || 'Erro de conexao.'));

  return session;
}

export function createMissionPlayerSession(options = {}) {
  if (typeof window.Peer !== 'function') {
    options.onError?.('PeerJS indisponivel.');
    return null;
  }
  const hostId = extractMissionJoinCode(options.hostId);
  if (!hostId) {
    options.onError?.('Codigo invalido.');
    return null;
  }

  const peer = new window.Peer();
  const session = {
    peer,
    conn: null,
    playerId: '',
    send(type, payload = {}) {
      return safeSend(session.conn, createMessage(type, { ...payload, playerId: session.playerId || payload.playerId }));
    },
    close() {
      session.conn?.close?.();
      peer.destroy?.();
    }
  };

  peer.on('open', () => {
    const conn = peer.connect(hostId, { reliable: true });
    session.conn = conn;
    conn.on('open', () => {
      safeSend(conn, createMessage('PLAYER_JOINED', {
        playerName: options.playerName,
        deviceId: peer.id
      }));
      options.onOpen?.();
    });
    conn.on('data', message => {
      if (message?.type === 'PLAYER_JOINED' && message.payload?.player?.id) {
        session.playerId = message.payload.player.id;
      }
      options.onMessage?.(message);
    });
    conn.on('close', () => options.onClose?.());
    conn.on('error', error => options.onError?.(error?.message || 'Erro de conexao.'));
  });
  peer.on('error', error => options.onError?.(error?.message || 'Erro de conexao.'));

  return session;
}
