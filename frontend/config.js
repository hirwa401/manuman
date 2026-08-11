const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://manuman-api.vercel.app/api';

const SUPABASE_URL = 'https://itdqaekjtojpksrgijfn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZHFhZWtqdG9qcGtzcmdpamZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDE3MjYsImV4cCI6MjEwMDU3NzcyNn0.um_6aiExMGt1SR1dSPchKopu1JSUMLtH3crXli1kLEk';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51U2e3NAZgd5ReLClZjgV8LiUGtJOTt5VNT3zOggKArHklpesrIXhY2liuF5KswQQMwkri2B0F3A2VHwQ0hwdu0ny00VbdwIfip';
