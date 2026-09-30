export const services = [
  { id: 'computer', name: 'Computer Repair', icon: 'desktop-outline', price: 299, tint: '#FFE9DA', color: '#FF6B00', rating: 4.8, bookings: 1240,
    desc: 'Fast, reliable repairs for desktops, laptops, software and hardware issues.' },
  { id: 'laptop', name: 'Laptop Repair', icon: 'laptop-outline', price: 299, tint: '#E0F2F5', color: '#1596A6', rating: 4.9, bookings: 980,
    desc: 'Screen, battery, keyboard and motherboard repairs for all laptop brands.' },
  { id: 'cctv', name: 'CCTV Installation', icon: 'videocam-outline', price: 2999, tint: '#E0F2F5', color: '#1596A6', rating: 4.8, bookings: 640,
    desc: 'Professional CCTV camera installation with DVR/NVR setup and mobile viewing.' },
  { id: 'security', name: 'Security Setup', icon: 'shield-checkmark-outline', price: 299, tint: '#ECE8FA', color: '#7C5CE0', rating: 4.7, bookings: 410,
    desc: 'Home security systems, alarms and smart door lock setup.' },
  { id: 'network', name: 'Networking', icon: 'git-network-outline', price: 299, tint: '#E0F2F5', color: '#1596A6', rating: 4.8, bookings: 520,
    desc: 'WiFi, router and LAN setup for homes and small offices.' },
  { id: 'printer', name: 'Printer Service', icon: 'print-outline', price: 299, tint: '#FDE4E4', color: '#E5484D', rating: 4.6, bookings: 330,
    desc: 'Printer installation, cartridge and connectivity troubleshooting.' },
  { id: 'recovery', name: 'Data Recovery', icon: 'server-outline', price: 499, tint: '#FFF3D6', color: '#D99100', rating: 4.7, bookings: 210,
    desc: 'Recover lost files from hard drives, SSDs, pen drives and memory cards.' },
  { id: 'software', name: 'Software & OS Setup', icon: 'cloud-download-outline', price: 249, tint: '#E0F0FA', color: '#2B7FD1', rating: 4.8, bookings: 760,
    desc: 'Windows install, drivers, antivirus and everyday software setup.' },
  { id: 'lock', name: 'Smart Lock & Alarm', icon: 'lock-closed-outline', price: 899, tint: '#ECE8FA', color: '#7C5CE0', rating: 4.7, bookings: 180,
    desc: 'Smart door lock, motion sensor and alarm installation.' },
  { id: 'amc', name: 'Annual Maintenance', icon: 'calendar-outline', price: 1999, tint: '#DDF3EE', color: '#1E9E7A', rating: 4.9, bookings: 140,
    desc: 'Yearly service plans for computers, CCTV and networks with priority visits.' },
];
export const popular = [
  { id: 'p1', serviceId: 'laptop', name: 'Laptop screen replacement', price: 1499, rating: 4.9, icon: 'laptop-outline' },
  { id: 'p2', serviceId: 'cctv', name: 'CCTV camera installation', price: 2999, rating: 4.8, icon: 'videocam-outline' },
];
export const included = [
  { icon: 'search-circle-outline', text: 'Diagnosis & estimate' },
  { icon: 'construct-outline', text: 'Hardware repair' },
  { icon: 'laptop-outline', text: 'Software troubleshooting' },
  { icon: 'shield-checkmark-outline', text: '30-day service warranty' },
];
const fmtISO = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
export const dates = [0, 1, 2, 3].map((n) => {
  const x = new Date(); x.setDate(x.getDate() + n);
  return { label: n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : x.toLocaleDateString('en-IN', { weekday: 'short' }), day: x.getDate(), iso: fmtISO(x) };
});
export const times = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
export const technician = {
  name: 'Hemant Kumar', role: 'Computer & Security System Specialist', rating: 4.9, reviews: 128,
  jobs: 246, years: 4, onTime: '98%', skills: ['Windows', 'CCTV', 'Networking', 'Hardware'],
  about: 'Specialist in computer repair, CCTV setup and home security systems.',
};
export const user = { name: 'Aarav Kapoor', phone: '+91 98765 43210', city: 'Bengaluru' };
export const address = { label: 'Home', line: '12B, Lake View Road, Indiranagar, Bengaluru' };
export const initialBookings = [
  { id: 'FXR-240625-0184', service: 'Computer Repair', icon: 'desktop-outline', when: 'Tomorrow, 25 Jun · 11:30 AM', area: 'Indiranagar, Bengaluru', status: 'Finding technician' },
  { id: 'FXR-240628-0102', service: 'CCTV Installation', icon: 'videocam-outline', when: 'Fri, 28 Jun · 02:00 PM', area: 'Koramangala, Bengaluru', status: 'Technician assigned' },
];
export const alerts = [
  { id: 1, icon: 'checkmark-circle-outline', title: 'Booking confirmed', body: 'Your Computer Repair booking is confirmed.', time: '2 min ago', unread: true, tint: '#E0F2F5' },
  { id: 2, icon: 'construct-outline', title: 'Technician assigned', body: 'Hemant Kumar accepted your request.', time: '18 min ago', unread: true, tint: '#E6EEF3' },
  { id: 3, icon: 'receipt-outline', title: 'Payment receipt', body: 'Payment receipt for ₹999 is ready.', time: 'Yesterday', unread: true, tint: '#FFF3D6' },
  { id: 4, icon: 'pricetag-outline', title: 'Special offer', body: 'Get ₹300 off your next service.', time: '2 days ago', unread: false, tint: '#FDE4DA' },
];
