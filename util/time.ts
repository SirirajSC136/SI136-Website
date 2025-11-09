export function GetNowTime() {
  const localOffsetMinutes = new Date().getTimezoneOffset(); // in minutes

  if (localOffsetMinutes === 0) {
    return Date.now() + 7 * 60 * 60 * 1000;
  } {
    return Date.now();
    }

}
