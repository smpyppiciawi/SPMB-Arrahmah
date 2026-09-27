/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import DocumentChecklist from './pages/DocumentChecklist';
import Interview from './pages/Interview';
import ParentMeeting from './pages/ParentMeeting';
import Payment from './pages/Payment';
import PaymentNew from './pages/PaymentNew';
import QuranTest from './pages/QuranTest';
import Registration from './pages/Registration';
import RegistrationForm from './pages/RegistrationForm';
import RegistrationReceipt from './pages/RegistrationReceipt';
import StudentBook from './pages/StudentBook';
import StudentDetail from './pages/StudentDetail';
import StudentList from './pages/StudentList';
import StudentPeriodic from './pages/StudentPeriodic';
import UniformMeasurement from './pages/UniformMeasurement';
import WaitingList from './pages/WaitingList';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DocumentChecklist": DocumentChecklist,
    "Interview": Interview,
    "ParentMeeting": ParentMeeting,
    "Payment": Payment,
    "PaymentNew": PaymentNew,
    "QuranTest": QuranTest,
    "Registration": Registration,
    "RegistrationForm": RegistrationForm,
    "RegistrationReceipt": RegistrationReceipt,
    "StudentBook": StudentBook,
    "StudentDetail": StudentDetail,
    "StudentList": StudentList,
    "StudentPeriodic": StudentPeriodic,
    "UniformMeasurement": UniformMeasurement,
    "WaitingList": WaitingList,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};