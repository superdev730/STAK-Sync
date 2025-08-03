import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Meetup, User } from "@shared/schema";

interface CalendarComponentProps {
  meetups: (Meetup & { organizer: User; attendee: User })[];
  onDateSelect?: (date: Date) => void;
}

export default function CalendarComponent({ meetups, onDateSelect }: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMeetupForDate = (day: number) => {
    return meetups.find(meetup => {
      const meetupDate = new Date(meetup.scheduledAt);
      return meetupDate.getDate() === day &&
             meetupDate.getMonth() === currentDate.getMonth() &&
             meetupDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-gold text-navy';
      case 'pending':
        return 'bg-light-blue text-navy';
      default:
        return 'bg-prof-green text-white';
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-playfair font-semibold text-navy">
            Your Schedule
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 text-charcoal font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="p-2"></div>;
            }

            const meetup = getMeetupForDate(day);
            const isToday = day === new Date().getDate() &&
                           currentDate.getMonth() === new Date().getMonth() &&
                           currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`p-2 text-center cursor-pointer rounded-lg transition-colors ${
                  meetup
                    ? `${getStatusColor(meetup.status)} font-semibold`
                    : isToday
                    ? 'bg-gray-200 text-charcoal'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onDateSelect?.(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gold rounded"></div>
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-light-blue rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-prof-green rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
