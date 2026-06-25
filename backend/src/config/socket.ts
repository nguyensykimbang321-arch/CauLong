import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: 'http://localhost:5173', // Giai đoạn dev để '*' cho dễ, thực tế nên đổi thành URL của Frontend
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    const role = socket.handshake.query.role;
    const userId = socket.handshake.query.userId;

    if (role === 'staff') {
      console.log('🏸 Trọng tài bàn (Staff) đã kết nối vào sân:', socket.id);
      socket.join('staff_room');
    } else if (userId) {
      console.log(`👤 User ${userId} đã kết nối vào sân:`, socket.id);
      socket.join(`user_${userId}`);
    } else {
      console.log('Khách vãng lai đã kết nối:', socket.id);
    }

    socket.on('disconnect', () => {
      console.log('👋 Client đã rời sân:', socket.id);
    });
  });

  return io;
};

// Hàm này dùng để các Controller gọi và phát thông báo
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};