import React from 'react';
import { Spin } from 'antd';

interface BookingScheduleGridProps {
  loading: boolean;
  courts: any[]; 
  rawBookedSlots: any[]; 
  onSlotClick: (court: any, slotData: any) => void;
  openTime?: string;
  closeTime?: string;
}

const BookingScheduleGrid: React.FC<BookingScheduleGridProps> = ({ 
  loading, 
  courts, 
  rawBookedSlots, 
  onSlotClick,
  openTime = '06:00:00',
  closeTime = '22:00:00'
}) => {
  const START_HOUR = openTime ? parseInt(openTime.split(':')[0]) : 6;
  const END_HOUR = closeTime ? parseInt(closeTime.split(':')[0]) : 22;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;

  const timeToRelativeMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (h < START_HOUR) return 0; 
    if (h > END_HOUR || (h === END_HOUR && m > 0)) return TOTAL_MINUTES;
    return (h - START_HOUR) * 60 + m;
  };
  
  if (loading) return <div className="p-10 text-center"><Spin size="large" /></div>;
  if (!courts || courts.length === 0) return <div className="p-10 text-center text-gray-500">Không có dữ liệu sân.</div>;

  const hours = Array.from({ length: TOTAL_HOURS }).map((_, i) => `${(START_HOUR + i).toString().padStart(2, '0')}:00`);

  const handleEmptyClick = (e: React.MouseEvent<HTMLDivElement>, court: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    
    const clickedMinutes = percent * TOTAL_MINUTES; 
    const roundedMinutes = Math.floor(clickedMinutes / 30) * 30; // Làm tròn 30p
    
    const absoluteMinutes = roundedMinutes + (START_HOUR * 60);
    
    const h = Math.floor(absoluteMinutes / 60).toString().padStart(2, '0');
    const m = (absoluteMinutes % 60).toString().padStart(2, '0');
    
    onSlotClick(court, { available: true, start: `${h}:${m}` });
  };

  return (
    <div className="relative w-full bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-475"> 
          
          <div className="flex border-b bg-gray-50 relative">
            <div className="w-50 sticky left-0 z-20 bg-gray-50 border-r p-3 font-semibold text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Tên Sân / Giờ
            </div>
            
            <div className="flex-1 flex relative">
              {hours.map((time, idx) => (
                <div key={idx} className="flex-1 border-r border-gray-200 p-2 text-center text-xs font-medium text-gray-500">
                  {time}
                </div>
              ))}
            </div>
          </div>

          {courts.map(court => (
            <div key={court.id} className="flex border-b hover:bg-gray-50 transition-colors">
              
              <div className="w-50 sticky left-0 z-20 bg-white border-r p-4 font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex items-center justify-center">
                {court.name}
              </div>
              
              <div 
                className="flex-1 relative cursor-crosshair h-20" 
                onClick={(e) => handleEmptyClick(e, court)}
              >
                {hours.map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-gray-100 pointer-events-none" style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}></div>
                ))}

                {rawBookedSlots
                  .filter(slot => slot.court_id === court.id)
                  .map((slot, idx) => {
                    
                    const startMins = timeToRelativeMinutes(slot.start_time);
                    const endMins = timeToRelativeMinutes(slot.end_time);
                    
                    if (endMins <= 0) return null;

                    const leftPercent = (startMins / TOTAL_MINUTES) * 100;
                    const widthPercent = ((endMins - startMins) / TOTAL_MINUTES) * 100;

                    return (
                      <div 
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClick(court, { available: false, ...slot });
                        }}
                        className="absolute top-2 bottom-2 rounded-md shadow-sm border border-yellow-400 bg-yellow-100 hover:bg-yellow-200 transition-all flex flex-col justify-center items-center z-10 cursor-pointer overflow-hidden"
                        style={{ 
                          left: `${leftPercent}%`, 
                          width: `${widthPercent}%` 
                        }}
                        title={`Đã đặt: ${slot.start_time} - ${slot.end_time}`}
                      >
                        <span className="font-bold text-yellow-800 text-xs whitespace-nowrap px-1">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {slot.price_cents && (
                          <span className="text-[10px] text-yellow-600 font-medium whitespace-nowrap">
                            {slot.price_cents / 1000}k
                          </span>
                        )}
                      </div>
                    )
                  })
                }
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default BookingScheduleGrid;