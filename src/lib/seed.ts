import { loadEnvConfig } from '@next/env';
import dbConnect from './mongodb';
import { Match } from '../models/Match';
import { Player } from '../models/Player';

loadEnvConfig(process.cwd());

// Use actual current date - April 3, 2026
const currentDate = new Date('2026-04-03T12:00:00+05:30');

const teams = {
  SRH: { name: 'Sunrisers Hyderabad', shortName: 'SRH' },
  RCB: { name: 'Royal Challengers Bengaluru', shortName: 'RCB' },
  KKR: { name: 'Kolkata Knight Riders', shortName: 'KKR' },
  MI: { name: 'Mumbai Indians', shortName: 'MI' },
  CSK: { name: 'Chennai Super Kings', shortName: 'CSK' },
  RR: { name: 'Rajasthan Royals', shortName: 'RR' },
  GT: { name: 'Gujarat Titans', shortName: 'GT' },
  PBKS: { name: 'Punjab Kings', shortName: 'PBKS' },
  DC: { name: 'Delhi Capitals', shortName: 'DC' },
  LSG: { name: 'Lucknow Super Giants', shortName: 'LSG' },
};

const venues: Record<string, string> = {
  Bengaluru: 'M. Chinnaswamy Stadium, Bengaluru',
  Mumbai: 'Wankhede Stadium, Mumbai',
  Guwahati: 'Barsapara Cricket Stadium, Guwahati',
  'New Chandigarh': 'PCA Stadium, New Chandigarh',
  Lucknow: 'Bharat Ratna Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
  Kolkata: 'Eden Gardens, Kolkata',
  Chennai: 'M. A. Chidambaram Stadium, Chennai',
  Delhi: 'Arun Jaitley Stadium, Delhi',
  Ahmedabad: 'Narendra Modi Stadium, Ahmedabad',
  Hyderabad: 'Rajiv Gandhi International Cricket Stadium, Hyderabad',
  Jaipur: 'Sawai Mansingh Stadium, Jaipur',
  Raipur: 'Shaheed Veer Narayan Singh International Cricket Stadium, Raipur',
  Dharamshala: 'HPCA Stadium, Dharamshala',
};

const matches = [
  { team1: 'SRH', team2: 'RCB', date: '2026-03-28', time: '19:30', venue: 'Bengaluru' },
  { team1: 'KKR', team2: 'MI', date: '2026-03-29', time: '19:30', venue: 'Mumbai' },
  { team1: 'CSK', team2: 'RR', date: '2026-03-30', time: '19:30', venue: 'Guwahati' },
  { team1: 'GT', team2: 'PBKS', date: '2026-03-31', time: '19:30', venue: 'New Chandigarh' },
  { team1: 'DC', team2: 'LSG', date: '2026-04-01', time: '19:30', venue: 'Lucknow' },
  { team1: 'SRH', team2: 'KKR', date: '2026-04-02', time: '19:30', venue: 'Kolkata' },
  { team1: 'PBKS', team2: 'CSK', date: '2026-04-03', time: '19:30', venue: 'Chennai' },
  { team1: 'MI', team2: 'DC', date: '2026-04-04', time: '15:30', venue: 'Delhi' },
  { team1: 'RR', team2: 'GT', date: '2026-04-04', time: '19:30', venue: 'Ahmedabad' },
  { team1: 'LSG', team2: 'SRH', date: '2026-04-05', time: '15:30', venue: 'Hyderabad' },
  { team1: 'CSK', team2: 'RCB', date: '2026-04-05', time: '19:30', venue: 'Bengaluru' },
  { team1: 'PBKS', team2: 'KKR', date: '2026-04-06', time: '19:30', venue: 'Kolkata' },
  { team1: 'MI', team2: 'RR', date: '2026-04-07', time: '19:30', venue: 'Guwahati' },
  { team1: 'GT', team2: 'DC', date: '2026-04-08', time: '19:30', venue: 'Delhi' },
  { team1: 'LSG', team2: 'KKR', date: '2026-04-09', time: '19:30', venue: 'Kolkata' },
  { team1: 'RCB', team2: 'RR', date: '2026-04-10', time: '19:30', venue: 'Guwahati' },
  { team1: 'SRH', team2: 'PBKS', date: '2026-04-11', time: '15:30', venue: 'New Chandigarh' },
  { team1: 'DC', team2: 'CSK', date: '2026-04-11', time: '19:30', venue: 'Chennai' },
  { team1: 'GT', team2: 'LSG', date: '2026-04-12', time: '15:30', venue: 'Lucknow' },
  { team1: 'RCB', team2: 'MI', date: '2026-04-12', time: '19:30', venue: 'Mumbai' },
  { team1: 'KKR', team2: 'GT', date: '2026-04-13', time: '19:30', venue: 'Ahmedabad' },
  { team1: 'MI', team2: 'LSG', date: '2026-04-14', time: '19:30', venue: 'Lucknow' },
  { team1: 'PBKS', team2: 'RCB', date: '2026-04-15', time: '19:30', venue: 'Bengaluru' },
  { team1: 'CSK', team2: 'GT', date: '2026-04-16', time: '19:30', venue: 'Ahmedabad' },
  { team1: 'SRH', team2: 'DC', date: '2026-04-17', time: '19:30', venue: 'Delhi' },
  { team1: 'RR', team2: 'PBKS', date: '2026-04-18', time: '15:30', venue: 'Jaipur' },
  { team1: 'KKR', team2: 'CSK', date: '2026-04-18', time: '19:30', venue: 'Chennai' },
  { team1: 'LSG', team2: 'RCB', date: '2026-04-19', time: '15:30', venue: 'Bengaluru' },
  { team1: 'DC', team2: 'KKR', date: '2026-04-19', time: '19:30', venue: 'Kolkata' },
  { team1: 'GT', team2: 'SRH', date: '2026-04-20', time: '19:30', venue: 'Hyderabad' },
  { team1: 'MI', team2: 'CSK', date: '2026-04-21', time: '19:30', venue: 'Chennai' },
  { team1: 'PBKS', team2: 'DC', date: '2026-04-22', time: '19:30', venue: 'Delhi' },
  { team1: 'RCB', team2: 'SRH', date: '2026-04-23', time: '19:30', venue: 'Hyderabad' },
  { team1: 'RR', team2: 'LSG', date: '2026-04-24', time: '19:30', venue: 'Lucknow' },
  { team1: 'KKR', team2: 'RR', date: '2026-04-25', time: '15:30', venue: 'Jaipur' },
  { team1: 'CSK', team2: 'MI', date: '2026-04-25', time: '19:30', venue: 'Mumbai' },
  { team1: 'GT', team2: 'PBKS', date: '2026-04-26', time: '19:30', venue: 'New Chandigarh' },
  { team1: 'LSG', team2: 'DC', date: '2026-04-27', time: '15:30', venue: 'Delhi' },
  { team1: 'SRH', team2: 'GT', date: '2026-04-27', time: '19:30', venue: 'Hyderabad' },
  { team1: 'RCB', team2: 'KKR', date: '2026-04-28', time: '19:30', venue: 'Kolkata' },
  { team1: 'MI', team2: 'SRH', date: '2026-04-29', time: '19:30', venue: 'Hyderabad' },
  { team1: 'PBKS', team2: 'LSG', date: '2026-04-30', time: '19:30', venue: 'Lucknow' },
  { team1: 'DC', team2: 'RR', date: '2026-05-01', time: '19:30', venue: 'Jaipur' },
  { team1: 'CSK', team2: 'KKR', date: '2026-05-02', time: '19:30', venue: 'Kolkata' },
  { team1: 'GT', team2: 'MI', date: '2026-05-03', time: '15:30', venue: 'Mumbai' },
  { team1: 'RCB', team2: 'DC', date: '2026-05-03', time: '19:30', venue: 'Delhi' },
  { team1: 'LSG', team2: 'CSK', date: '2026-05-04', time: '19:30', venue: 'Chennai' },
  { team1: 'RR', team2: 'SRH', date: '2026-05-05', time: '19:30', venue: 'Hyderabad' },
  { team1: 'KKR', team2: 'PBKS', date: '2026-05-06', time: '19:30', venue: 'New Chandigarh' },
  { team1: 'MI', team2: 'GT', date: '2026-05-07', time: '19:30', venue: 'Ahmedabad' },
  { team1: 'DC', team2: 'RCB', date: '2026-05-08', time: '19:30', venue: 'Delhi' },
  { team1: 'CSK', team2: 'LSG', date: '2026-05-09', time: '15:30', venue: 'Lucknow' },
  { team1: 'PBKS', team2: 'RR', date: '2026-05-09', time: '19:30', venue: 'Jaipur' },
  { team1: 'SRH', team2: 'CSK', date: '2026-05-10', time: '19:30', venue: 'Chennai' },
  { team1: 'KKR', team2: 'MI', date: '2026-05-11', time: '19:30', venue: 'Mumbai' },
  { team1: 'GT', team2: 'RCB', date: '2026-05-12', time: '19:30', venue: 'Bengaluru' },
  { team1: 'LSG', team2: 'PBKS', date: '2026-05-13', time: '19:30', venue: 'New Chandigarh' },
  { team1: 'DC', team2: 'MI', date: '2026-05-14', time: '19:30', venue: 'Mumbai' },
  { team1: 'RR', team2: 'CSK', date: '2026-05-15', time: '19:30', venue: 'Chennai' },
  { team1: 'RCB', team2: 'PBKS', date: '2026-05-16', time: '19:30', venue: 'New Chandigarh' },
  { team1: 'SRH', team2: 'LSG', date: '2026-05-17', time: '15:30', venue: 'Lucknow' },
  { team1: 'KKR', team2: 'GT', date: '2026-05-17', time: '19:30', venue: 'Ahmedabad' },
  { team1: 'MI', team2: 'PBKS', date: '2026-05-18', time: '19:30', venue: 'New Chandigarh' },
  { team1: 'CSK', team2: 'DC', date: '2026-05-19', time: '19:30', venue: 'Delhi' },
  { team1: 'RCB', team2: 'LSG', date: '2026-05-20', time: '19:30', venue: 'Lucknow' },
  { team1: 'RR', team2: 'KKR', date: '2026-05-21', time: '19:30', venue: 'Kolkata' },
  { team1: 'GT', team2: 'CSK', date: '2026-05-22', time: '19:30', venue: 'Chennai' },
  { team1: 'DC', team2: 'SRH', date: '2026-05-23', time: '19:30', venue: 'Hyderabad' },
  { team1: 'LSG', team2: 'MI', date: '2026-05-24', time: '19:30', venue: 'Mumbai' },
];

const players = [
  { name: 'Pat Cummins', role: 'bowler', team: 'SRH', price: 8.25, isOverseas: true },
  { name: 'Travis Head', role: 'batsman', team: 'SRH', price: 6.5, isOverseas: true },
  { name: 'Abhishek Sharma', role: 'all-rounder', team: 'SRH', price: 5.5 },
  { name: 'Heinrich Klaasen', role: 'wicket-keeper', team: 'SRH', price: 5.0, isOverseas: true },
  { name: 'Bhuvneshwar Kumar', role: 'bowler', team: 'SRH', price: 4.5 },
  { name: 'Washington Sundar', role: 'all-rounder', team: 'SRH', price: 3.5 },
  { name: 'Nitish Kumar Reddy', role: 'batsman', team: 'SRH', price: 3.0 },
  { name: 'Mohammad Shami', role: 'bowler', team: 'SRH', price: 2.5 },
  { name: 'Ishant Sharma', role: 'bowler', team: 'SRH', price: 1.5 },
  { name: 'T Natarajan', role: 'bowler', team: 'SRH', price: 1.5 },
  { name: 'Rahul Tripathi', role: 'batsman', team: 'SRH', price: 1.5 },
  { name: 'Kane Williamson', role: 'batsman', team: 'SRH', price: 2.0, isOverseas: true },
  { name: 'Young Pacer 1', role: 'bowler', team: 'SRH', price: 0.3 },
  { name: 'Young Pacer 2', role: 'bowler', team: 'SRH', price: 0.3 },
  { name: 'All-Rounder 1', role: 'all-rounder', team: 'SRH', price: 0.5 },
  { name: 'All-Rounder 2', role: 'all-rounder', team: 'SRH', price: 0.3 },
  { name: 'Wicket Keeper 1', role: 'wicket-keeper', team: 'SRH', price: 0.5 },
  { name: 'Wicket Keeper 2', role: 'wicket-keeper', team: 'SRH', price: 0.3 },
  { name: 'Spin Bowler 1', role: 'bowler', team: 'SRH', price: 0.5 },
  { name: 'Spin Bowler 2', role: 'bowler', team: 'SRH', price: 0.3 },
  { name: 'Young Batsman 1', role: 'batsman', team: 'SRH', price: 0.3 },
  { name: 'Young Batsman 2', role: 'batsman', team: 'SRH', price: 0.3 },
  { name: 'Pacer 1', role: 'bowler', team: 'SRH', price: 0.3 },
  { name: 'Pacer 2', role: 'bowler', team: 'SRH', price: 0.3 },
  { name: 'Utility Player 1', role: 'all-rounder', team: 'SRH', price: 0.3 },

  { name: 'Virat Kohli', role: 'batsman', team: 'RCB', price: 11.0 },
  { name: 'Rajat Patidar', role: 'batsman', team: 'RCB', price: 6.5 },
  { name: 'Rohit Sharma', role: 'batsman', team: 'RCB', price: 6.0 },
  { name: 'Kirat Boli', role: 'batsman', team: 'RCB', price: 0.8 },
  { name: 'Phil Salt', role: 'wicket-keeper', team: 'RCB', price: 5.0, isOverseas: true },
  { name: 'Liam Livingstone', role: 'all-rounder', team: 'RCB', price: 4.5, isOverseas: true },
  { name: 'Josh Hazlewood', role: 'bowler', team: 'RCB', price: 4.0, isOverseas: true },
  { name: 'Mohammed Siraj', role: 'bowler', team: 'RCB', price: 3.5 },
  { name: 'Bhuvneshwar Kumar', role: 'bowler', team: 'RCB', price: 3.0 },
  { name: 'Swapnil Singh', role: 'all-rounder', team: 'RCB', price: 2.5 },
  { name: 'Suyash Prabhudessai', role: 'batsman', team: 'RCB', price: 1.5 },
  { name: 'Manish Pandey', role: 'batsman', team: 'RCB', price: 1.5 },
  { name: 'Mayank Dagar', role: 'all-rounder', team: 'RCB', price: 1.2 },
  { name: 'Anuj Rawat', role: 'wicket-keeper', team: 'RCB', price: 1.0 },
  { name: 'Dinesh Karthik', role: 'wicket-keeper', team: 'RCB', price: 2.0 },
  { name: 'Tom Curran', role: 'all-rounder', team: 'RCB', price: 1.5, isOverseas: true },
  { name: 'Reece Topley', role: 'bowler', team: 'RCB', price: 1.5, isOverseas: true },
  { name: 'Raj Bhardwaj', role: 'all-rounder', team: 'RCB', price: 0.5 },
  { name: 'Vijay Kumar', role: 'batsman', team: 'RCB', price: 0.3 },
  { name: 'Akash Deep', role: 'bowler', team: 'RCB', price: 0.5 },
  { name: 'Mukesh Choudhary', role: 'bowler', team: 'RCB', price: 0.3 },
  { name: 'Saurav Chauhan', role: 'batsman', team: 'RCB', price: 0.3 },
  { name: 'Himanshu Sharma', role: 'bowler', team: 'RCB', price: 0.3 },
  { name: 'Ruturaj Borkar', role: 'batsman', team: 'RCB', price: 0.3 },
  { name: 'Praveen', role: 'bowler', team: 'RCB', price: 0.3 },

  { name: 'Shubman Gill', role: 'batsman', team: 'KKR', price: 9.0 },
  { name: 'Andre Russell', role: 'all-rounder', team: 'KKR', price: 8.0, isOverseas: true },
  { name: 'Sunil Narine', role: 'all-rounder', team: 'KKR', price: 6.0, isOverseas: true },
  { name: 'Nitish Rana', role: 'batsman', team: 'KKR', price: 5.0 },
  { name: 'Rinku Singh', role: 'batsman', team: 'KKR', price: 4.5 },
  { name: 'Varun Chakravarthy', role: 'bowler', team: 'KKR', price: 4.0 },
  { name: 'Venkatesh Iyer', role: 'all-rounder', team: 'KKR', price: 3.5 },
  { name: 'Harshit Rana', role: 'bowler', team: 'KKR', price: 2.0 },
  { name: 'Ramandeep Singh', role: 'all-rounder', team: 'KKR', price: 1.5 },
  { name: 'Sherfane Rutherford', role: 'batsman', team: 'KKR', price: 3.0, isOverseas: true },
  { name: 'Angkrish Raghuvanshi', role: 'batsman', team: 'KKR', price: 1.5 },
  { name: 'Rahmanullah Gurbaz', role: 'wicket-keeper', team: 'KKR', price: 2.5, isOverseas: true },
  { name: 'Vaibhav Arora', role: 'bowler', team: 'KKR', price: 1.5 },
  { name: 'Suyash Sharma', role: 'bowler', team: 'KKR', price: 1.0 },
  { name: 'Kane Russell', role: 'bowler', team: 'KKR', price: 1.5, isOverseas: true },
  { name: 'Chetan Sakariya', role: 'bowler', team: 'KKR', price: 1.2 },
  { name: 'Prasidh Krishna', role: 'bowler', team: 'KKR', price: 2.5 },
  { name: 'Moeen Ali', role: 'all-rounder', team: 'KKR', price: 3.0, isOverseas: true },
  { name: 'Lockie Ferguson', role: 'bowler', team: 'KKR', price: 2.0, isOverseas: true },
  { name: 'Naman Dhir', role: 'all-rounder', team: 'KKR', price: 0.5 },
  { name: 'Rohit Paudel', role: 'batsman', team: 'KKR', price: 0.5, isOverseas: true },
  { name: 'Kuldeep Yadav', role: 'bowler', team: 'KKR', price: 2.0 },
  { name: 'Umran Malik', role: 'bowler', team: 'KKR', price: 0.5 },
  { name: 'Abhishek Porel', role: 'wicket-keeper', team: 'KKR', price: 0.5 },
  { name: 'Ashutosh Sharma', role: 'batsman', team: 'KKR', price: 0.3 },

  { name: 'Hardik Pandya', role: 'all-rounder', team: 'MI', price: 7.3 },
  { name: 'Jasprit Bumrah', role: 'bowler', team: 'MI', price: 8.0 },
  { name: 'Suryakumar Yadav', role: 'batsman', team: 'MI', price: 7.2 },
  { name: 'Rohit Sharma', role: 'batsman', team: 'MI', price: 7.2 },
  { name: 'Tilak Varma', role: 'batsman', team: 'MI', price: 3.6 },
  { name: 'Quinton de Kock', role: 'wicket-keeper', team: 'MI', price: 2.5, isOverseas: true },
  { name: 'Trent Boult', role: 'bowler', team: 'MI', price: 5.6, isOverseas: true },
  { name: 'Deepak Chahar', role: 'bowler', team: 'MI', price: 4.1 },
  { name: 'Will Jacks', role: 'all-rounder', team: 'MI', price: 2.3, isOverseas: true },
  { name: 'Mitchell Santner', role: 'all-rounder', team: 'MI', price: 2.0, isOverseas: true },
  { name: 'Shardul Thakur', role: 'all-rounder', team: 'MI', price: 2.0 },
  { name: 'Corbin Bosch', role: 'all-rounder', team: 'MI', price: 1.5, isOverseas: true },
  { name: 'Robin Minz', role: 'wicket-keeper', team: 'MI', price: 0.8 },
  { name: 'Ryan Rickelton', role: 'batsman', team: 'MI', price: 1.5, isOverseas: true },
  { name: 'Sherfane Rutherford', role: 'batsman', team: 'MI', price: 3.0, isOverseas: true },
  { name: 'Naman Dhir', role: 'all-rounder', team: 'MI', price: 2.3 },
  { name: 'Mayank Markande', role: 'bowler', team: 'MI', price: 0.8 },
  { name: 'Karn Sharma', role: 'bowler', team: 'MI', price: 1.5 },
  { name: 'Vishnu Vinod', role: 'wicket-keeper', team: 'MI', price: 0.3 },
  { name: 'Shams Mulani', role: 'all-rounder', team: 'MI', price: 0.3 },
  { name: 'Nuttan Sahanekar', role: 'batsman', team: 'MI', price: 0.3 },
  { name: 'Chetan S', role: 'bowler', team: 'MI', price: 0.3 },
  { name: 'Raghav G', role: 'batsman', team: 'MI', price: 0.3 },
  { name: 'Ayush K', role: 'all-rounder', team: 'MI', price: 0.3 },

  { name: 'Ruturaj Gaikwad', role: 'batsman', team: 'CSK', price: 6.5 },
  { name: 'MS Dhoni', role: 'wicket-keeper', team: 'CSK', price: 4.0 },
  { name: 'Ravindra Jadeja', role: 'all-rounder', team: 'CSK', price: 7.0 },
  { name: 'Matheesha Pathirana', role: 'bowler', team: 'CSK', price: 2.5, isOverseas: true },
  { name: 'Shivam Dube', role: 'all-rounder', team: 'CSK', price: 3.5 },
  { name: 'Devon Conway', role: 'batsman', team: 'CSK', price: 4.0, isOverseas: true },
  { name: 'Deepak Hooda', role: 'all-rounder', team: 'CSK', price: 2.5 },
  { name: 'Ajinkya Rahane', role: 'batsman', team: 'CSK', price: 2.0 },
  { name: 'Moeen Ali', role: 'all-rounder', team: 'CSK', price: 4.0, isOverseas: true },
  { name: 'Tushar Deshpande', role: 'bowler', team: 'CSK', price: 1.5 },
  { name: 'Maheesh Theekshana', role: 'bowler', team: 'CSK', price: 2.0, isOverseas: true },
  { name: 'Shaik Rasheed', role: 'batsman', team: 'CSK', price: 1.0 },
  { name: 'Sameer Rizvi', role: 'batsman', team: 'CSK', price: 1.5 },
  { name: 'Mukesh Choudhary', role: 'bowler', team: 'CSK', price: 1.5 },
  { name: 'Prashant Solanki', role: 'bowler', team: 'CSK', price: 1.0 },
  { name: 'Nishant Sandhu', role: 'bowler', team: 'CSK', price: 0.5 },
  { name: 'Rajvardhan Hangargekar', role: 'bowler', team: 'CSK', price: 0.8 },
  { name: 'Avanish Rao', role: 'all-rounder', team: 'CSK', price: 0.5 },
  { name: 'Sai Sudharsan', role: 'batsman', team: 'CSK', price: 1.5 },
  { name: 'Kamlesh Nagarkoti', role: 'bowler', team: 'CSK', price: 1.0 },
  { name: 'Chetann S', role: 'batsman', team: 'CSK', price: 0.3 },
  { name: 'Arnav B', role: 'wicket-keeper', team: 'CSK', price: 0.3 },
  { name: 'Varun', role: 'bowler', team: 'CSK', price: 0.3 },
  { name: 'Rohit R', role: 'batsman', team: 'CSK', price: 0.3 },

  { name: 'Sanju Samson', role: 'wicket-keeper', team: 'RR', price: 6.0 },
  { name: 'Yashasvi Jaiswal', role: 'batsman', team: 'RR', price: 8.0 },
  { name: 'Riyan Parvar', role: 'all-rounder', team: 'RR', price: 5.0 },
  { name: 'Dhruv Jurel', role: 'wicket-keeper', team: 'RR', price: 2.5 },
  { name: 'Sandeep Sharma', role: 'bowler', team: 'RR', price: 4.0 },
  { name: 'Navdeep Saini', role: 'bowler', team: 'RR', price: 2.5 },
  { name: 'R Ashwin', role: 'bowler', team: 'RR', price: 5.0 },
  { name: 'Shimron Hetmyer', role: 'batsman', team: 'RR', price: 3.5, isOverseas: true },
  { name: 'Jos Buttler', role: 'batsman', team: 'RR', price: 6.0, isOverseas: true },
  { name: 'Trent Boult', role: 'bowler', team: 'RR', price: 4.5, isOverseas: true },
  { name: 'Prasidh Krishna', role: 'bowler', team: 'RR', price: 2.5 },
  { name: 'Kunal Singh', role: 'all-rounder', team: 'RR', price: 2.0 },
  { name: 'Kuldeep Yadav', role: 'bowler', team: 'RR', price: 2.5 },
  { name: 'Dhruv J', role: 'batsman', team: 'RR', price: 1.5 },
  { name: 'Abmushek Musheer', role: 'batsman', team: 'RR', price: 1.0 },
  { name: 'Akash Vashisht', role: 'all-rounder', team: 'RR', price: 0.5 },
  { name: 'Raghav B', role: 'batsman', team: 'RR', price: 0.3 },
  { name: 'Tanay S', role: 'bowler', team: 'RR', price: 0.3 },
  { name: 'Nitish S', role: 'batsman', team: 'RR', price: 0.3 },
  { name: 'Aashray K', role: 'all-rounder', team: 'RR', price: 0.3 },
  { name: 'Vaibhav S', role: 'wicket-keeper', team: 'RR', price: 0.3 },
  { name: 'Arpit G', role: 'bowler', team: 'RR', price: 0.3 },
  { name: 'Yatin K', role: 'batsman', team: 'RR', price: 0.3 },
  { name: 'Hemant R', role: 'all-rounder', team: 'RR', price: 0.3 },
  { name: 'Rohit S', role: 'batsman', team: 'RR', price: 0.3 },

  { name: 'Shubman Gill', role: 'batsman', team: 'GT', price: 8.5 },
  { name: 'Rashid Khan', role: 'bowler', team: 'GT', price: 9.0, isOverseas: true },
  { name: 'Hardik Pandya', role: 'all-rounder', team: 'GT', price: 7.0 },
  { name: 'David Miller', role: 'batsman', team: 'GT', price: 4.5, isOverseas: true },
  { name: 'Kane Williamson', role: 'batsman', team: 'GT', price: 4.0, isOverseas: true },
  { name: 'Mohammed Shami', role: 'bowler', team: 'GT', price: 4.5 },
  { name: 'Sai Sudharsan', role: 'batsman', team: 'GT', price: 2.5 },
  { name: 'Rahul Tewatia', role: 'all-rounder', team: 'GT', price: 2.0 },
  { name: 'Prasidh Krishna', role: 'bowler', team: 'GT', price: 2.5 },
  { name: 'Noor Ahmad', role: 'bowler', team: 'GT', price: 2.0, isOverseas: true },
  { name: 'Manav Suthar', role: 'all-rounder', team: 'GT', price: 1.5 },
  { name: 'Sherfane Rutherford', role: 'batsman', team: 'GT', price: 2.5, isOverseas: true },
  { name: 'Vijay Kumar', role: 'batsman', team: 'GT', price: 1.0 },
  { name: 'Azmat K', role: 'all-rounder', team: 'GT', price: 0.5 },
  { name: 'Darshan N', role: 'bowler', team: 'GT', price: 0.3 },
  { name: 'Rohit D', role: 'wicket-keeper', team: 'GT', price: 0.3 },
  { name: 'Arjun A', role: 'batsman', team: 'GT', price: 0.3 },
  { name: 'Chetan R', role: 'all-rounder', team: 'GT', price: 0.3 },
  { name: 'Naman G', role: 'batsman', team: 'GT', price: 0.3 },
  { name: 'Kartik T', role: 'bowler', team: 'GT', price: 0.3 },
  { name: 'Kunal S', role: 'wicket-keeper', team: 'GT', price: 0.3 },
  { name: 'Ravi K', role: 'all-rounder', team: 'GT', price: 0.3 },
  { name: 'Yash M', role: 'batsman', team: 'GT', price: 0.3 },
  { name: 'Sanjay J', role: 'bowler', team: 'GT', price: 0.3 },

  { name: 'Shikhar Dhawan', role: 'batsman', team: 'PBKS', price: 5.5 },
  { name: 'Sam Curran', role: 'all-rounder', team: 'PBKS', price: 8.5, isOverseas: true },
  { name: 'Arshdeep Singh', role: 'bowler', team: 'PBKS', price: 4.5 },
  { name: 'Kagiso Rabada', role: 'bowler', team: 'PBKS', price: 4.5, isOverseas: true },
  { name: 'Liam Livingstone', role: 'all-rounder', team: 'PBKS', price: 4.0, isOverseas: true },
  { name: 'Jitesh Sharma', role: 'wicket-keeper', team: 'PBKS', price: 3.0 },
  { name: 'Prabhsimran Singh', role: 'wicket-keeper', team: 'PBKS', price: 2.0 },
  { name: 'Rilee Rossouw', role: 'batsman', team: 'PBKS', price: 3.0, isOverseas: true },
  { name: 'Harpreet Brar', role: 'all-rounder', team: 'PBKS', price: 1.5 },
  { name: 'Nathan Ellis', role: 'bowler', team: 'PBKS', price: 1.5, isOverseas: true },
  { name: 'Baltej Singh', role: 'bowler', team: 'PBKS', price: 0.5 },
  { name: 'Kumar Kushagra', role: 'wicket-keeper', team: 'PBKS', price: 1.5 },
  { name: 'Vishnu Vinod', role: 'wicket-keeper', team: 'PBKS', price: 0.5 },
  { name: 'Atharva Taide', role: 'batsman', team: 'PBKS', price: 0.5 },
  { name: 'Aniket Choudhary', role: 'bowler', team: 'PBKS', price: 0.5 },
  { name: 'Mandeep Singh', role: 'batsman', team: 'PBKS', price: 1.0 },
  { name: 'Shivam K', role: 'all-rounder', team: 'PBKS', price: 0.3 },
  { name: 'Rahul B', role: 'batsman', team: 'PBKS', price: 0.3 },
  { name: 'Prince Y', role: 'bowler', team: 'PBKS', price: 0.3 },
  { name: 'Gurnoor S', role: 'batsman', team: 'PBKS', price: 0.3 },
  { name: 'Naveen K', role: 'bowler', team: 'PBKS', price: 0.3 },
  { name: 'Rohit P', role: 'all-rounder', team: 'PBKS', price: 0.3 },
  { name: 'Kartik S', role: 'wicket-keeper', team: 'PBKS', price: 0.3 },
  { name: 'Yash Dh', role: 'batsman', team: 'PBKS', price: 0.3 },
  { name: 'Ashish N', role: 'bowler', team: 'PBKS', price: 0.3 },

  { name: 'David Warner', role: 'batsman', team: 'DC', price: 6.0, isOverseas: true },
  { name: 'Rishabh Pant', role: 'wicket-keeper', team: 'DC', price: 7.0 },
  { name: 'Kuldeep Yadav', role: 'bowler', team: 'DC', price: 4.5 },
  { name: 'Axar Patel', role: 'all-rounder', team: 'DC', price: 4.5 },
  { name: 'Anrich Nortje', role: 'bowler', team: 'DC', price: 4.0, isOverseas: true },
  { name: 'Prithvi Shaw', role: 'batsman', team: 'DC', price: 3.5 },
  { name: 'Shreyas Iyer', role: 'batsman', team: 'DC', price: 5.0 },
  { name: 'Ishant Sharma', role: 'bowler', team: 'DC', price: 2.0 },
  { name: 'Mukesh Kumar', role: 'bowler', team: 'DC', price: 2.5 },
  { name: 'Vicky Ostwal', role: 'bowler', team: 'DC', price: 1.0 },
  { name: 'Abhishek Porel', role: 'wicket-keeper', team: 'DC', price: 1.5 },
  { name: 'Tristan Stubbs', role: 'batsman', team: 'DC', price: 2.0, isOverseas: true },
  { name: 'Jake Fraser-McGurk', role: 'batsman', team: 'DC', price: 2.5, isOverseas: true },
  { name: 'Donovan Ferreira', role: 'batsman', team: 'DC', price: 1.5, isOverseas: true },
  { name: 'Ricky Bhui', role: 'batsman', team: 'DC', price: 1.0 },
  { name: 'Swastik Chikki', role: 'batsman', team: 'DC', price: 0.5 },
  { name: 'Lalit Yadav', role: 'all-rounder', team: 'DC', price: 1.5 },
  { name: 'Praveen', role: 'bowler', team: 'DC', price: 0.3 },
  { name: 'Rohit S', role: 'batsman', team: 'DC', price: 0.3 },
  { name: 'Avesh Khan', role: 'bowler', team: 'DC', price: 1.5 },
  { name: 'Jhye Richardson', role: 'bowler', team: 'DC', price: 2.0, isOverseas: true },
  { name: 'Khaleel Ahmed', role: 'bowler', team: 'DC', price: 1.0 },
  { name: 'Shardul N', role: 'all-rounder', team: 'DC', price: 1.0 },
  { name: 'Aarish A', role: 'bowler', team: 'DC', price: 0.3 },
  { name: 'Priyam G', role: 'batsman', team: 'DC', price: 0.3 },

  { name: 'KL Rahul', role: 'wicket-keeper', team: 'LSG', price: 7.0 },
  { name: 'Quinton de Kock', role: 'wicket-keeper', team: 'LSG', price: 4.0, isOverseas: true },
  { name: 'Nicholas Pooran', role: 'batsman', team: 'LSG', price: 5.0, isOverseas: true },
  { name: 'Ravi Bishnoi', role: 'bowler', team: 'LSG', price: 3.5 },
  { name: 'Mohsin Khan', role: 'bowler', team: 'LSG', price: 2.5 },
  { name: 'Ayush Badoni', role: 'batsman', team: 'LSG', price: 2.0 },
  { name: 'Marcus Stoinis', role: 'all-rounder', team: 'LSG', price: 5.0, isOverseas: true },
  { name: 'Deepak Hooda', role: 'all-rounder', team: 'LSG', price: 2.5 },
  { name: 'Krunal Pandya', role: 'all-rounder', team: 'LSG', price: 3.0 },
  { name: 'Kuldeep Yadav', role: 'bowler', team: 'LSG', price: 2.5 },
  { name: 'Naveen-ul-Haq', role: 'bowler', team: 'LSG', price: 2.0, isOverseas: true },
  { name: 'Mayank Yadav', role: 'bowler', team: 'LSG', price: 2.0 },
  { name: 'Rohit Khan', role: 'batsman', team: 'LSG', price: 1.0 },
  { name: 'Arshin Kulkarni', role: 'batsman', team: 'LSG', price: 0.8 },
  { name: 'Manimaran S', role: 'all-rounder', team: 'LSG', price: 0.5 },
  { name: 'Kunal B', role: 'batsman', team: 'LSG', price: 0.3 },
  { name: 'Vishnu S', role: 'wicket-keeper', team: 'LSG', price: 0.3 },
  { name: 'Rohit C', role: 'bowler', team: 'LSG', price: 0.3 },
  { name: 'Prashant K', role: 'all-rounder', team: 'LSG', price: 0.3 },
  { name: 'Ankit R', role: 'bowler', team: 'LSG', price: 0.3 },
  { name: 'Yashwant S', role: 'batsman', team: 'LSG', price: 0.3 },
  { name: 'Amit M', role: 'all-rounder', team: 'LSG', price: 0.3 },
  { name: 'Shivam P', role: 'batsman', team: 'LSG', price: 0.3 },
  { name: 'Dhruv R', role: 'wicket-keeper', team: 'LSG', price: 0.3 },
  { name: 'Harsh K', role: 'bowler', team: 'LSG', price: 0.3 },
];

function getMatchStatus(matchDate: Date): 'completed' | 'upcoming' | 'live' {
  if (matchDate < currentDate) {
    return 'completed';
  }
  return 'upcoming';
}

function calculateCreditValue(price: number): number {
  return Math.round(price * 4 * 10) / 10;
}

async function seed() {
  await dbConnect();
  
  console.log('Seeding IPL 2026 data...');
  console.log('Current date:', currentDate.toISOString());
  
  await Player.deleteMany({});
  await Match.deleteMany({});
  
  const playerDocs = players.map(p => ({
    name: p.name,
    role: p.role,
    team: p.team,
    creditValue: calculateCreditValue(p.price),
    isOverseas: p.isOverseas || false,
    stats: {
      matches: 0,
      runs: 0,
      wickets: 0,
      average: 0,
      strikeRate: 0,
    },
  }));
  
  const createdPlayers = await Player.insertMany(playerDocs);
  console.log(`Created ${createdPlayers.length} IPL players`);
  
  const matchDocs = matches.map((m, index) => {
    const [year, month, day] = m.date.split('-').map(Number);
    const [hours, minutes] = m.time.split(':').map(Number);
    const matchDate = new Date(year, month - 1, day, hours, minutes);
    
    return {
      team1: teams[m.team1 as keyof typeof teams],
      team2: teams[m.team2 as keyof typeof teams],
      venue: venues[m.venue],
      date: matchDate,
      status: getMatchStatus(matchDate),
      format: 'T20' as const,
      season: 'IPL 2026',
      matchNumber: index + 1,
    };
  });
  
  const createdMatches = await Match.insertMany(matchDocs);
  console.log(`Created ${createdMatches.length} IPL 2026 matches`);
  
  const completedMatches = createdMatches.filter(m => m.status === 'completed').length;
  const upcomingMatches = createdMatches.filter(m => m.status === 'upcoming').length;
  console.log(`Status breakdown: ${completedMatches} completed, ${upcomingMatches} upcoming`);
  
  console.log('IPL 2026 seeding complete!');

  return {
    matches: createdMatches.length,
    players: createdPlayers.length,
  };
}

export default seed;

if (process.argv[1]?.endsWith('src/lib/seed.ts')) {
  seed()
    .then(() => {
      console.log('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
