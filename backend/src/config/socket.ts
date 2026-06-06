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
    console.log('🏸 Trọng tài bàn (Staff) đã kết nối vào sân:', socket.id);
    
    // Đưa tất cả nhân viên vào chung một "phòng" để dễ thông báo
    socket.join('staff_room');

    socket.on('disconnect', () => {
      console.log('👋 Staff đã rời sân:', socket.id);
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