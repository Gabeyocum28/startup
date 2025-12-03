// Real WebSocket client for live notifications
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = [];
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  // Connect to WebSocket server
  connect() {
    // Determine protocol (ws or wss) based on current page protocol
    const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
    const wsUrl = `${protocol}://${window.location.host}`;

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    // Connection opened
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
    };

    // Listen for messages
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Only process newReview messages
        if (data.type === 'newReview') {
          const notification = {
            id: Date.now(),
            userName: data.userName,
            albumName: data.albumName,
            rating: data.rating,
            timestamp: new Date().toISOString()
          };

          // Notify all listeners
          this.notifyListeners(notification);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Connection closed
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.attemptReconnect();
    };

    // Connection error
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Attempt to reconnect after connection loss
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Add a listener for notifications
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notify all listeners of a new notification
  notifyListeners(notification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      console.log('Closing WebSocket connection');
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Export singleton instance
export const webSocketClient = new WebSocketClient();
