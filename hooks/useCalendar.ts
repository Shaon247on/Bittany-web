import { useState } from 'react';

export function useCalendar() {
  const [activeTab, setActiveTab] = useState('Month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleNextMonth = () => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)));
  const handlePrevMonth = () => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)));
  
  const handleNextDay = () => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
  const handlePrevDay = () => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));

  // Generate days for the month grid
  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null); // Padding
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  return {
    activeTab, setActiveTab,
    selectedDate, setSelectedDate,
    calendarDays: getDaysInMonth(),
    handleNextMonth, handlePrevMonth,
    handleNextDay, handlePrevDay,
    monthName: selectedDate.toLocaleString('default', { month: 'long' }),
    year: selectedDate.getFullYear()
  };
}