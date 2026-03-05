declare module "react-native-calendar-picker" {
  import { Component } from "react";

  export interface CalendarPickerProps {
    allowRangeSelection?: boolean;
    startFromMonday?: boolean;
    minDate?: Date;
    maxDate?: Date;
    selectedStartDate?: Date | null;
    selectedEndDate?: Date | null;
    onDateChange?: (date: Date | null, type?: string) => void;
    todayBackgroundColor?: string;
    selectedDayColor?: string;
    selectedDayTextColor?: string;
    selectedRangeStyle?: object;
    textStyle?: object;
    todayTextStyle?: object;
    initialDate?: Date;
    [key: string]: unknown;
  }

  export default class CalendarPicker extends Component<CalendarPickerProps> {}
}
