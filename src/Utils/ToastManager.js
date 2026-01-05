class ToastManager {
  constructor() {
    this.listeners = [];
  }

  on(event, callback) {
    if (event === 'show') {
      this.listeners.push(callback);
    }
  }

  off(event, callback) {
    if (event === 'show') {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    }
  }

  emit(event, data) {
    if (event === 'show') {
      this.listeners.forEach(listener => listener(data));
    }
  }

  show(message, type = 'success', duration = 3000) {
    this.emit('show', { message, type, duration });
  }

  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message, duration = 3000) {
    this.show(message, 'error', duration);
  }

  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
}

const toastManager = new ToastManager();
export default toastManager;


