export const speakSuccessSound = (amount: number) => {
    if ('speechSynthesis' in window) {
      const text = `Đã thanh toán thành công, ${amount} đồng`; 
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // 3. Xóa các hàng đợi âm thanh cũ (nếu có) và phát câu mới
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };