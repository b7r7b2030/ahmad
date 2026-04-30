/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-hijri';

// Set locale to Arabic for Hijri dates
moment.locale('ar-SA');

declare global {
  interface Window {
    XLSX: any;
  }
}

interface Teacher {
  name: string;
  phone: string;
  area: string;
}

interface MsgLog {
  id: string;
  teacherName: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed';
}

interface Assignment {
  area: string;
  teacherIdx: string;
}

interface DayData {
  date: string;
  supervisorIdx: string;
  assignments: Assignment[];
}

interface WeekData {
  days: DayData[];
}

const BUILTIN: Teacher[] = [
  {name:'عبدالله مشبب عايض القحطاني',phone:'966504580716',area:'الملعب'},
  {name:'فيصل بن سراج بن رابع الفهمي',phone:'966544405688',area:'الفناء الشرقي'},
  {name:'سعد عتيق محمد السفياني',phone:'966540692544',area:'الفناء الشرقي'},
  {name:'احمد علي احمد الغامدي',phone:'966554761843',area:'الفناء الشمالي'},
  {name:'محمد احمد محمد الغامدي',phone:'966531333352',area:'المقصف'},
  {name:'عادل زويد معيوف السلمي',phone:'966504698879',area:'المشرف'},
  {name:'سمير صالح مسفر الغامدي',phone:'966554804070',area:'الملعب'},
  {name:'مذكور رده مخضور الجدعاني',phone:'966530166011',area:'الفناء الشرقي'},
  {name:'علي بن محمد الأسمري',phone:'966500203385',area:'الملعب'},
  {name:'مهند احمد محمد الغامدي',phone:'966546073100',area:'المقصف'},
  {name:'احمد محمد علي الزهراني',phone:'966555546563',area:'الفناء الشمالي'},
  {name:'وليد ادريس عرار شبعاني',phone:'966502056759',area:'المقصف'},
  {name:'عبدالله بن سفر السلمي',phone:'966555222154',area:'الفناء الشمالي'},
  {name:'عبدالله محمد حمد الغامدي',phone:'966504588843',area:'الملعب'},
  {name:'محمد عاشور عبدالله الزهراني',phone:'966545054848',area:'الملعب'},
  {name:'عبدالكريم محمد سعيد الزهراني',phone:'966508748799',area:'الفناء الشمالي'},
  {name:'مسفر عبدالله الشمراني',phone:'966566347136',area:'الفناء الشرقي'},
  {name:'مهدي عبدالله محمد العيافي',phone:'966506106933',area:'المقصف'},
  {name:'علي بن محمد الزهراني',phone:'966551441669',area:'الفناء الشمالي'},
  {name:'محمد أحمد المنتشري',phone:'966504588327',area:'الفناء الشرقي'},
  {name:'سعيد حسن محمد العبدلي',phone:'966506631348',area:'المشرف'},
  {name:'عبدالرحمن محمد علي البارقي',phone:'966502274475',area:'الفناء الشمالي'},
  {name:'مازن محمود سيامي',phone:'966566613044',area:'الفناء الشمالي'},
  {name:'طلال عباس عبد الرحمن اسحاق',phone:'966555591564',area:'المقصف'},
  {name:'سلطان بن حمود الجهني',phone:'966562399930',area:'الفناء الشرقي'},
  {name:'زين حسن عاطف الزيلعي',phone:'966503071743',area:'الملعب'},
  {name:'عبدالله صالح سعد القرني',phone:'966534885452',area:'المشرف'},
  {name:'عبيد بن فهد البقمي',phone:'966595926795',area:'الفناء الشرقي'},
  {name:'احمد شبرين الشمراني',phone:'966501700598',area:'الفناء الشمالي'},
  {name:'فهد غازي حماد العصيمي',phone:'966533300961',area:'الفناء الشمالي'},
  {name:'ظافر محمد ظافر الشهري',phone:'966531001188',area:'الفناء الشرقي'},
  {name:'علي محمد احمد الريش',phone:'966509781865',area:'الفناء الشمالي'},
  {name:'هاشم احمد سعد المالكي',phone:'966504274172',area:'المقصف'},
  {name:'علي محمد احمد العمري',phone:'966501705659',area:'المشرف'},
  {name:'محمد محيل حمدي العتيبي',phone:'966541171867',area:'الفناء الشرقي'},
  {name:'علي مرضي محمد القرني',phone:'966563888701',area:'المشرف'},
  {name:'احمد عبيد الصعيدي',phone:'966545350447',area:'الفناء الشمالي'},
  {name:'محمد حسين محمد مسرحي',phone:'966558336602',area:'الملعب'}
];

const DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
const AREAS = ['المشرف','الفناء الشمالي','الفناء الشرقي','المقصف','الملعب'];

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activePage, setActivePage] = useState('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [msgLogs, setMsgLogs] = useState<MsgLog[]>([]);
  const [sentToday, setSentToday] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  
  // Schedule Form State
  const [sYear, setSYear] = useState('1447هـ');
  const [sWeeks, setSWeeks] = useState(5);
  const [sStartWeekNum, setSStartWeekNum] = useState(1);
  const [sPrinc, setSPrinc] = useState('نايف أحمد الشهري');
  const [sDep, setSDep] = useState('أحمد محمد القرني');
  const [sStartDate, setSStartDate] = useState(moment().format('iYYYY/iMM/iDD')); 
  const [scheduleData, setScheduleData] = useState<WeekData[]>([]);

  // Master week pattern (repeats every week)
  const [masterWeek, setMasterWeek] = useState<DayData[]>(
    DAYS.map(() => ({
      date: '',
      supervisorIdx: '',
      assignments: [
        { area: 'المشرف', teacherIdx: '' },
        { area: 'الفناء الشمالي', teacherIdx: '' },
        { area: 'الفناء الشمالي', teacherIdx: '' },
        { area: 'المقصف', teacherIdx: '' },
        { area: 'المقصف', teacherIdx: '' },
        { area: 'الفناء الشرقي', teacherIdx: '' },
        { area: 'الفناء الشرقي', teacherIdx: '' },
        { area: 'الملعب', teacherIdx: '' },
        { area: 'الملعب', teacherIdx: '' },
      ]
    }))
  );

  // Report Form State
  const [rDay, setRDay] = useState('الأحد');
  const [rDate, setRDate] = useState('');
  const [rSupIdx, setRSupIdx] = useState<string>('');
  const [rAbs, setRAbs] = useState('no');
  const [rSig, setRSig] = useState('yes');
  const [rPrs, setRPrs] = useState('yes');
  const [rNotes, setRNotes] = useState('');
  const [reportHtml, setReportHtml] = useState<string>('');

  // Notify Form State
  const [wkMsg, setWkMsg] = useState('السلام عليكم ورحمة الله وبركاته\nنُذكّركم بمراجعة الوكيل للتوقيع في سجل الإشراف اليومي.\nوجزاكم الله خيرًا 🌟');
  const [mTeacherIdx, setMTeacherIdx] = useState<string>('');
  const [mType, setMType] = useState('weekly');
  const [mMsg, setMMsg] = useState('');

  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'report' | null>(null);

  // Helper for Hijri Calendar
  const getHijriDaysInMonth = (month: number, year: number) => {
    const startOfMonth = moment(`${year}/${month}/01`, 'iYYYY/iMM/iDD').startOf('iMonth');
    const daysInMonth = moment.iDaysInMonth(year, month - 1);
    const firstDayOfWeek = startOfMonth.day(); // 0 is Sunday
    return { daysInMonth, firstDayOfWeek };
  };

  const [pickerMonth, setPickerMonth] = useState(parseInt(moment().format('iM')));
  const [pickerYear, setPickerYear] = useState(parseInt(moment().format('iYYYY')));

  const HijriCalendar = () => {
    const { daysInMonth, firstDayOfWeek } = getHijriDaysInMonth(pickerMonth, pickerYear);
    const dayNames = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
    const monthNames = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64 text-right" dir="rtl">
        <div className="flex justify-between items-center mb-4">
          <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
            if (pickerMonth === 12) { setPickerMonth(1); setPickerYear(y => y + 1); }
            else setPickerMonth(m => m + 1);
          }}>◀</button>
          <div className="font-bold text-sm">
            {monthNames[pickerMonth - 1]} {pickerYear}
          </div>
          <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
            if (pickerMonth === 1) { setPickerMonth(12); setPickerYear(y => y - 1); }
            else setPickerMonth(m => m - 1);
          }}>▶</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map(d => <div key={d} className="text-[10px] font-bold text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => (
            d ? (
              <button
                key={i}
                className="p-1 text-xs hover:bg-[#1D9E75] hover:text-white rounded transition-colors"
                onClick={() => {
                  const formatted = `${pickerYear}/${pickerMonth.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
                  if (pickerTarget === 'start') setSStartDate(formatted);
                  if (pickerTarget === 'report') setRDate(formatted);
                  setPickerTarget(null);
                }}
              >
                {d}
              </button>
            ) : <div key={i}></div>
          ))}
        </div>
      </div>
    );
  };

  const xlsInRef = useRef<HTMLInputElement>(null);

  const teacherOptions = teachers.map((t, i) => (
    <option key={i} value={i}>{t.name}</option>
  ));

  useEffect(() => {
    const savedTeachers = localStorage.getItem('sup_teachers');
    if (savedTeachers) {
      try {
        setTeachers(JSON.parse(savedTeachers));
      } catch (e) {
        console.error("Error loading teachers", e);
      }
    }
    const savedSched = localStorage.getItem('sup_schedule');
    if (savedSched) {
      try {
        setScheduleData(JSON.parse(savedSched));
      } catch (e) {
        console.error("Error loading schedule", e);
      }
    }
    const savedMaster = localStorage.getItem('sup_master_week');
    if (savedMaster) {
      try {
        setMasterWeek(JSON.parse(savedMaster));
      } catch (e) {
        console.error("Error loading master week", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sup_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('sup_master_week', JSON.stringify(masterWeek));
  }, [masterWeek]);

  useEffect(() => {
    if (scheduleData && scheduleData.length > 0) {
      localStorage.setItem('sup_schedule', JSON.stringify(scheduleData));
    }
  }, [scheduleData]);

  useEffect(() => {
    setMsgTpl(mType);
  }, [mType]);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const loadBuiltin = () => {
    setTeachers(BUILTIN.map(t => ({ ...t })));
    toast('✅ تم تحميل 38 معلماً');
  };

  const importXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = window.XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
        let addedCount = 0;
        const newTeachers: Teacher[] = [];
        rows.forEach(row => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.includes('اسم') || k.includes('name') || k.includes('Name'));
          const phoneKey = keys.find(k => k.includes('جوال') || k.includes('هاتف') || k.includes('phone') || k.includes('Phone') || k.includes('موبايل'));
          const areaKey = keys.find(k => k.includes('منطقة') || k.includes('موقع') || k.includes('area'));
          const name = (row[nameKey || ''] || '').toString().trim();
          const phone = (row[phoneKey || ''] || '').toString().trim().replace(/\s/g, '');
          const area = areaKey ? (row[areaKey] || 'المشرف').toString().trim() : 'المشرف';
          if (name && phone) {
            newTeachers.push({ name, phone, area });
            addedCount++;
          }
        });
        setTeachers(prev => [...prev, ...newTeachers]);
        toast('✅ تم استيراد ' + addedCount + ' معلم');
      } catch (err: any) {
        toast('❌ خطأ في قراءة الملف: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    if (xlsInRef.current) xlsInRef.current.value = '';
  };

  const addTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const nameInput = document.getElementById('nName') as HTMLInputElement;
    const phoneInput = document.getElementById('nPhone') as HTMLInputElement;
    const areaSelect = document.getElementById('nArea') as HTMLSelectElement;
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const area = areaSelect.value;
    
    if (!name || !phone) {
      toast('❌ أدخل الاسم والجوال');
      return;
    }
    setTeachers(prev => [...prev, { name, phone, area }]);
    nameInput.value = '';
    phoneInput.value = '';
    toast('✅ تمت إضافة المعلم');
  };

  const deleteTeacher = (index: number) => {
    setTeachers(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (confirm('هل تريد مسح جميع المعلمين؟')) {
      setTeachers([]);
    }
  };

  const wa = (phone: string, name: string, msg: string) => {
    const clean = phone.toString().replace(/\D/g, '');
    const intl = clean.startsWith('0') ? '966' + clean.slice(1) : clean;
    const text = msg || wkMsg || 'مرحباً';
    window.open('https://wa.me/' + intl + '?text=' + encodeURIComponent(text), '_blank');
    setSentToday(prev => prev + 1);
    logMsg(name || phone, text);
  };

  const sendAll = () => {
    if (!teachers.length) {
      toast('❌ لا يوجد معلمون');
      return;
    }
    teachers.forEach(t => {
      const clean = t.phone.toString().replace(/\D/g, '');
      const intl = clean.startsWith('0') ? '966' + clean.slice(1) : clean;
      window.open('https://wa.me/' + intl + '?text=' + encodeURIComponent(wkMsg), '_blank');
    });
    setSentToday(prev => prev + teachers.length);
    logMsg('جميع المعلمين (' + teachers.length + ')', wkMsg);
    toast('✅ تم فتح واتساب لإرسال الرسائل');
  };

  const logMsg = (to: string, msg: string) => {
    const now = new Date();
    const newEntry = { to, msg, time: now.toLocaleTimeString('ar') };
    setMsgLogs(prev => [newEntry, ...prev]);
  };

  const setMsgTpl = (type: string) => {
    const msgs: Record<string, string> = {
      weekly: 'السلام عليكم\nنُذكّركم بمراجعة الوكيل للتوقيع في سجل الإشراف اليومي. وجزاكم الله خيراً.',
      absent: 'السلام عليكم\nتم تسجيل غيابكم اليوم. يُرجى التواصل مع الإدارة لتوضيح السبب.',
      nosign: 'السلام عليكم\nلم يتم توقيعكم في سجل الإشراف اليومي. يُرجى المراجعة للتوقيع.',
      nopos: 'السلام عليكم\nلم تتواجد في موقع الإشراف المحدد. يُرجى الالتزام بالموقع المخصص.',
      custom: ''
    };
    setMMsg(msgs[type] || '');
  };

  const sendOne = () => {
    if (mTeacherIdx === '' || !mMsg) {
      toast('❌ اختر معلماً واكتب الرسالة');
      return;
    }
    const t = teachers[parseInt(mTeacherIdx)];
    wa(t.phone, t.name, mMsg);
  };

  const updateMasterCell = (dIdx: number, assignmentIdx: number | 'sup', value: string) => {
    const newMaster = [...masterWeek];
    if (assignmentIdx === 'sup') {
      newMaster[dIdx].supervisorIdx = value;
    } else {
      newMaster[dIdx].assignments[assignmentIdx as number].teacherIdx = value;
    }
    setMasterWeek(newMaster);
  };

  const generateFullSchedule = () => {
    if (!teachers.length) {
      toast('❌ أضف معلمين أولاً');
      return;
    }

    const newWeeks: WeekData[] = [];
    let startMoment = moment(sStartDate, 'iYYYY/iMM/iDD');
    
    for (let w = 0; w < sWeeks; w++) {
      const days: DayData[] = masterWeek.map((masterDay, dIdx) => {
        let dateToUse = startMoment.clone().add((w * 7) + dIdx, 'days');
        
        return {
          ...masterDay,
          date: dateToUse.format('iYYYY/iMM/iDD'),
          assignments: masterDay.assignments.map(a => ({ ...a }))
        };
      });
      newWeeks.push({ days });
    }
    setScheduleData(newWeeks);
    setSelectedWeekIdx(0);
    setActivePage('schedule_view');
    toast(`✅ تم توليد ${sWeeks} أسبوعاً بنجاح بدءاً من الأسبوع ${sStartWeekNum}`);
  };

  const autoFillMaster = () => {
    if (!teachers.length) {
      toast('❌ أضف معلمين أولاً');
      return;
    }
    
    const byArea: Record<string, number[]> = {};
    AREAS.forEach(a => {
      byArea[a] = teachers.map((t, i) => t.area === a ? i : -1).filter(i => i !== -1);
    });

    const newMaster = [...masterWeek];
    newMaster.forEach((day, dIdx) => {
      // Supervisor
      const sups = byArea['المشرف'] || [];
      day.supervisorIdx = sups.length ? sups[dIdx % sups.length].toString() : '';
      
      // Assignments
      day.assignments.forEach((asg, aIdx) => {
        const areaTeachers = byArea[asg.area] || [];
        if (areaTeachers.length) {
          // simple logic: areaTeachers[ (dIdx + aIdx) % length ]
          day.assignments[aIdx].teacherIdx = areaTeachers[(dIdx + aIdx) % areaTeachers.length].toString();
        }
      });
    });
    setMasterWeek(newMaster);
    toast('✅ تم توزيع المعلمين تلقائياً في الجدول الرئيسي');
  };

  const genReport = () => {
    const getChecked = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return [];
      return Array.from(el.querySelectorAll('input:checked'))
        .map((cb: any) => teachers[parseInt(cb.value)]?.name).filter(Boolean);
    };

    const absList = rAbs === 'yes' ? getChecked('abs-list') : [];
    const sigList = rSig === 'no' ? getChecked('sig-list') : [];
    const prsList = rPrs === 'no' ? getChecked('prs-list') : [];

    const html = `
      <div class="print-wrap" id="rpt" style="padding: 0 0 15mm 0; background: white; color: black; font-family: 'Amiri', serif; direction: rtl; width: 21cm; min-height: 29.7cm; margin: auto; box-sizing: border-box; position: relative; border: 1px solid #eee;">
        <div style="background: #0a3d4d; color: white; padding: 20px 40px; border-bottom-left-radius: 30px; border-bottom-right-radius: 30px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; line-height: 1.6; font-weight: bold;">
            المملكة العربية السعودية<br>
            وزارة التعليم<br>
            الإدارة العامة للتعليم بمحافظة جدة<br>
            ثانوية الأمير عبدالمجيد الأول
          </div>
          <div style="text-align: center;">
             <div style="font-size: 24px; font-weight: bold;">وزارة التعليم</div>
             <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Ministry of Education</div>
          </div>
        </div>

        <div style="padding: 0 15mm;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; border-bottom: 3px solid #0a3d4d; padding: 5px 30px; font-size: 24px; font-weight: 900; color: #0a3d4d;">
              تقرير الإشراف اليومي
            </div>
            <div style="font-size: 13px; margin-top: 5px; color: #666; font-weight: bold;">الشؤون التعليمية بالمدرسة - نموذج: إشراف/01</div>
          </div>

          <div style="font-size: 16px; line-height: 2.4;">
            <div style="display: flex; gap: 80px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <div>يوم الإشراف: <span style="font-weight: bold; font-size: 18px; color: #0a3d4d;">${rDay}</span></div>
              <div>التاريخ: <span style="font-weight: bold; font-size: 18px; color: #0a3d4d;">${rDate || '... / ... / ...'}</span> هـ</div>
            </div>

            <p style="font-weight: bold; margin-bottom: 15px; color: #333;">بناءً على الجولات التفقدية ومتابعة سجل الإشراف اليومي، تم رصد ما يلي:</p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none;">
              <tr style="border-bottom: 1px dashed #bbb;">
                <td style="padding: 12px 0; width: 280px; font-weight: bold; vertical-align: top;">1- غياب للمعلمين:</td>
                <td style="padding: 12px 0;">
                  <span style="border: 2px solid #0a3d4d; padding: 2px 12px; margin-left: 10px; border-radius: 4px;">${rAbs === 'yes' ? '✓' : '&nbsp;'}</span> نعم
                  <span style="border: 2px solid #0a3d4d; padding: 2px 12px; margin-right: 30px; margin-left: 10px; border-radius: 4px;">${rAbs === 'no' ? '✓' : '&nbsp;'}</span> لا 
                  ${rAbs === 'yes' ? `<div style="margin-top: 10px; font-size: 14px; line-height: 1.6; background: #f9f9f9; padding: 8px; border-right: 3px solid #0a3d4d;">الأسماء: <span style="font-weight: bold;">${absList.join('، ') || '................'}</span></div>` : ''}
                </td>
              </tr>
              <tr style="border-bottom: 1px dashed #bbb;">
                <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">2- توقيع المعلمين:</td>
                <td style="padding: 12px 0;">
                  <span style="border: 2px solid #0a3d4d; padding: 2px 12px; margin-left: 10px; border-radius: 4px;">${rSig === 'yes' ? '✓' : '&nbsp;'}</span> نعم
                  <span style="border: 2px solid #0a3d4d; padding: 2px 12px; margin-right: 30px; margin-left: 10px; border-radius: 4px;">${rSig === 'no' ? '✓' : '&nbsp;'}</span> لا 
                  ${rSig === 'no' ? `<div style="margin-top: 10px; font-size: 14px; line-height: 1.6; background: #f9f9f9; padding: 8px; border-right: 3px solid #0a3d4d;">الأسماء: <span style="font-weight: bold;">${sigList.join('، ') || '................'}</span></div>` : ''}
                </td>
              </tr>
              <tr style="border-bottom: 1px dashed #bbb;">
                <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">3- التواجد في مواقع الإشراف:</td>
                <td style="padding: 12px 0;">
                  <span style="border: 2px solid #0a3d4d; padding: 2px 12px; margin-left: 10px; border-radius: 4px;">${rPrs === 'yes' ? '✓' : '&nbsp;'}</span> نعم
                  <span style="border: 2px solid #0a3d4d; padding: 2px 12px; margin-right: 30px; margin-left: 10px; border-radius: 4px;">${rPrs === 'no' ? '✓' : '&nbsp;'}</span> لا 
                  ${rPrs === 'no' ? `<div style="margin-top: 10px; font-size: 14px; line-height: 1.6; background: #f9f9f9; padding: 8px; border-right: 3px solid #0a3d4d;">الأسماء: <span style="font-weight: bold;">${prsList.join('، ') || '................'}</span></div>` : ''}
                </td>
              </tr>
            </table>

            <div style="margin-top: 10px;">
              <div style="font-weight: bold; margin-bottom: 10px; color: #0a3d4d;">4- ملاحظات إضافية / مرئيات أخرى:</div>
              <div style="border: 1.5px solid #0a3d4d; min-height: 140px; padding: 15px; line-height: 1.8; font-size: 15px; background: #fff; white-space: pre-wrap; border-radius: 8px;">${rNotes || 'لا توجد ملاحظات إضافية لهذا اليوم.'}</div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px; text-align: center;">
              <div style="width: 250px;">
                <div style="font-weight: bold; margin-bottom: 45px; font-size: 16px;">المناوب / المشرف</div>
                <div style="border-bottom: 1.5px solid #333; width: 100%; margin-bottom: 5px;"></div>
                <div style="font-size: 11px;">الاسم والتوقيع</div>
              </div>
              <div style="width: 250px;">
                <div style="font-weight: bold; margin-bottom: 45px; font-size: 16px;">وكيل الشؤون التعليمية</div>
                <div style="border-bottom: 1.5px solid #333; width: 100%; margin-bottom: 5px; font-size: 18px; font-weight: 900;">${sDep}</div>
                <div style="font-size: 11px;">توقيع الوكيل</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    setReportHtml(html);
  };

  const doPrint = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>طباعة</title>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
    <style>
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      @media print {
        body { padding: 0; margin: 0; background: white; }
        .print-wrap { 
          box-shadow: none !important; 
          border: none !important; 
          width: 100% !important; 
          height: auto !important; 
          margin: 0 !important; 
          padding: 5mm !important;
          page-break-after: avoid; 
        }
        .ph { background: #f0f0f0 !important; color: black !important; border-bottom: 2px solid black !important; -webkit-print-color-adjust: exact; }
        .ph * { color: black !important; }
        table { width: 100% !important; }
        th, td { font-size: 10px !important; padding: 2px 4px !important; }
      }
      body {
        font-family: 'Amiri', serif;
        direction: rtl;
        background: #f0f0f0;
        margin: 0;
      }
      .print-wrap {
        background: white;
        width: 21cm;
        min-height: 29.7cm;
        margin: 10px auto;
        padding: 1.5cm;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        box-sizing: border-box;
      }
      table { border-collapse: collapse; width: 100%; border: 2.5px solid black; }
      th, td { border: 1.5px solid black; padding: 3px 5px; }
      th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
    </style></head><body>${el.innerHTML}</body></html>`);

    setTimeout(() => {
      w.print();
      w.close();
    }, 700);
  };

  const filteredTeachers = searchQuery 
    ? teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.phone.includes(searchQuery))
    : teachers;

  return (
    <div className="min-h-screen">
      {toastMsg && <div className="success-toast" style={{ display: 'block' }}>{toastMsg}</div>}

      <div className="topbar">
        <div>
          <h1>نظام إدارة الإشراف اليومي</h1>
          <p>المملكة العربية السعودية - وزارة التعليم - الإدارة العامة للتعليم بجدة</p>
        </div>
        <div className="text-left opacity-85 text-[11px]">
          ثانوية الأمير<br />عبدالمجيد الأول
        </div>
      </div>

      <div className="nav">
        <button className={`nav-btn ${activePage === 'teachers' ? 'active' : ''}`} onClick={() => setActivePage('teachers')}>👥 المعلمون</button>
        <button className={`nav-btn ${activePage === 'schedule' ? 'active' : ''}`} onClick={() => setActivePage('schedule')}>⚙️ إعداد الجدول</button>
        <button className={`nav-btn ${activePage === 'schedule_view' ? 'active' : ''}`} onClick={() => setActivePage('schedule_view')}>📅 الجدول النهائي</button>
        <button className={`nav-btn ${activePage === 'report' ? 'active' : ''}`} onClick={() => setActivePage('report')}>📋 تقرير يومي</button>
        <button className={`nav-btn ${activePage === 'notify' ? 'active' : ''}`} onClick={() => setActivePage('notify')}>📨 الإشعارات</button>
      </div>

      {/* TEACHERS PAGE */}
      <div className={`page ${activePage === 'teachers' ? 'active' : ''}`}>
        <div className="stats">
          <div className="stat"><div className="n">{teachers.length}</div><div className="l">إجمالي المعلمين</div></div>
          <div className="stat"><div className="n">5</div><div className="l">مناطق الإشراف</div></div>
          <div className="stat"><div className="n">{sentToday}</div><div className="l">مُرسَلة اليوم</div></div>
        </div>

        <div className="card">
          <div className="card-title">📤 استيراد من Excel</div>
          <div className="upload-area" onClick={() => xlsInRef.current?.click()}>
            <div className="text-[28px] mb-1.5">📊</div>
            <div className="font-medium text-[#0F6E56] text-sm">اضغط لرفع ملف Excel</div>
            <div className="text-[12px] text-[#888] mt-1">الأعمدة المطلوبة: <b>اسم المعلم</b> و <b>الجوال</b></div>
            <input type="file" ref={xlsInRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={importXLSX} />
          </div>
          <div className="mt8 flex gap-2 flex-wrap items-center">
            <button className="btn btn-outline btn-sm" onClick={loadBuiltin}>تحميل بيانات المعلمين المُرفقة (38 معلم)</button>
          </div>
        </div>

        <form className="card" onSubmit={addTeacher}>
          <div className="card-title">➕ إضافة معلم يدوياً</div>
          <div className="form-row three">
            <div className="form-group"><label>اسم المعلم</label><input id="nName" placeholder="الاسم كاملاً" required /></div>
            <div className="form-group"><label>رقم الجوال</label><input id="nPhone" placeholder="966XXXXXXXXX" required /></div>
            <div className="form-group">
              <label>منطقة الإشراف</label>
              <select id="nArea" defaultValue="المشرف">
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">إضافة</button>
        </form>

        <div className="card">
          <div className="card-title flex-bet">
            <span>📋 قائمة المعلمين ({teachers.length})</span>
            <div className="flex gap-1.5 flex-wrap">
              <input 
                placeholder="بحث..." 
                className="w-[160px] p-[5px_10px] text-[12px]" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-danger btn-sm" onClick={clearAll}>مسح الكل</button>
            </div>
          </div>
          <div id="teacherList">
            {filteredTeachers.length === 0 ? (
              <p className="text-center p-5 text-[#888]">لا يوجد معلمون. استورد الملف أو أضف يدوياً</p>
            ) : (
              filteredTeachers.map((t, i) => {
                const originalIndex = teachers.indexOf(t);
                return (
                  <div key={i} className="teacher-row">
                    <div className="t-avatar">{t.name.charAt(0)}</div>
                    <div className="t-info">
                      <div className="name">{t.name}</div>
                      <div className="phone">{t.phone} &nbsp; <span className="badge badge-teal">{t.area}</span></div>
                    </div>
                    <button className="btn btn-wa btn-sm ml-1" onClick={() => wa(t.phone, t.name, 'مرحباً')}>واتساب</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTeacher(originalIndex)}>حذف</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE CONFIG PAGE */}
      <div className={`page ${activePage === 'schedule' ? 'active' : ''}`}>
        <div className="card">
          <div className="card-title">⚙️ إعدادات الجدول الرئيسي (النمط الأسبوعي)</div>
          <div className="form-row three">
            <div className="form-group"><label>العام الدراسي</label><input value={sYear} onChange={e => setSYear(e.target.value)} /></div>
            <div className="form-group"><label>عدد أسابيع الفصل</label><input type="number" value={sWeeks} min="1" max="25" onChange={e => setSWeeks(parseInt(e.target.value) || 1)} /></div>
            <div className="form-group"><label>رقم أسبوع البداية</label><input type="number" value={sStartWeekNum} min="1" onChange={e => setSStartWeekNum(parseInt(e.target.value) || 1)} /></div>
          </div>
          <div className="form-row three">
            <div className="form-group relative">
              <label>تاريخ البداية (هجري)</label>
              <div className="flex gap-2">
                <input value={sStartDate} readOnly onClick={() => setPickerTarget(prev => prev === 'start' ? null : 'start')} className="cursor-pointer bg-gray-50" placeholder="YYYY/MM/DD" />
                <button className="btn btn-outline btn-sm" onClick={() => setPickerTarget(prev => prev === 'start' ? null : 'start')}>📅</button>
              </div>
              {pickerTarget === 'start' && <HijriCalendar />}
            </div>
            <div className="form-group"><label>اسم مدير المدرسة</label><input value={sPrinc} placeholder="نايف أحمد الشهري" onChange={e => setSPrinc(e.target.value)} /></div>
            <div className="form-group"><label>وكيل الشؤون التعليمية</label><input value={sDep} placeholder="أحمد محمد القرني" onChange={e => setSDep(e.target.value)} /></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-blue" onClick={autoFillMaster}>توزيع تلقائي للمقترح</button>
            <button className="btn btn-primary" onClick={generateFullSchedule}>توليد الجدول لجميع الأسابيع 🚀</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">✍️ تعبئة النمط الأسبوعي الثابت</div>
          <p className="text-xs text-gray-500 mb-4">الأسماء التي تختارها هنا ستتكرر في نفس اليوم من كل أسبوع طوال الفصل الدراسي.</p>
          <div className="overflow-x-auto">
            <table className="sch-table">
              <thead>
                <tr>
                  <th>اليوم</th>
                  <th colSpan={2}>المناوب</th>
                  <th>جهة الإشراف</th>
                  <th>الاسم المختارة</th>
                </tr>
              </thead>
              <tbody>
                {masterWeek.map((day, dIdx) => (
                  day.assignments.map((asg, aIdx) => (
                    <tr key={`${dIdx}-${aIdx}`}>
                      {aIdx === 0 && (
                        <td rowSpan={day.assignments.length} className="day-cell align-middle font-bold border-l-2 border-l-[#1D9E75]">
                          {DAYS[dIdx]}
                        </td>
                      )}
                      {aIdx === 0 && (
                        <td rowSpan={day.assignments.length} className="sup-cell align-middle p-1">
                          <select 
                            className="bg-transparent text-[11px] text-center w-full outline-none"
                            value={day.supervisorIdx}
                            onChange={(e) => updateMasterCell(dIdx, 'sup', e.target.value)}
                          >
                            <option value="">- اختر المناوب -</option>
                            {teacherOptions}
                          </select>
                        </td>
                      )}
                      {aIdx === 0 && (
                        <td rowSpan={day.assignments.length} className="sup-cell min-w-[30px]"></td>
                      )}
                      
                      <td className="text-right px-2 font-medium bg-[#f9f9f9] text-[10px]">{asg.area}</td>
                      <td className="p-0">
                        <select 
                          className="bg-transparent text-[11px] w-full text-center outline-none"
                          value={asg.teacherIdx}
                          onChange={(e) => updateMasterCell(dIdx, aIdx, e.target.value)}
                        >
                          <option value="">- اختر معلم -</option>
                          {teacherOptions}
                        </select>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SCHEDULE VIEW PAGE */}
      <div className={`page ${activePage === 'schedule_view' ? 'active' : ''}`}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4 bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-md font-bold text-[#185FA5] ml-4">عرض ونمذجة الجدول:</h2>
            <div className="flex items-center bg-gray-50 border rounded-lg p-1 gap-1">
              <button 
                className="px-3 py-1 hover:bg-white rounded shadow-sm text-sm disabled:opacity-30" 
                disabled={selectedWeekIdx === 0} 
                onClick={() => setSelectedWeekIdx(prev => Math.max(0, prev - 1))}
              >السابق</button>
              <select 
                className="bg-transparent px-2 py-1 text-sm font-bold text-center border-none focus:ring-0 w-36"
                value={selectedWeekIdx}
                onChange={(e) => setSelectedWeekIdx(parseInt(e.target.value))}
              >
                {scheduleData.length > 0 ? (
                  scheduleData.map((_, i) => (
                    <option key={i} value={i}>الأسبوع {i + sStartWeekNum}</option>
                  ))
                ) : (
                  <option value={0}>- لا يوجد جدول -</option>
                )}
              </select>
              <button 
                className="px-3 py-1 hover:bg-white rounded shadow-sm text-sm disabled:opacity-30" 
                disabled={scheduleData.length === 0 || selectedWeekIdx === scheduleData.length - 1} 
                onClick={() => setSelectedWeekIdx(prev => Math.min(scheduleData.length - 1, prev + 1))}
              >التالي</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => generateFullSchedule()}>🔄 تحديث البيانات</button>
            <button className="btn btn-primary" onClick={() => doPrint('schedOut')}>🖨️ طباعة هذا الأسبوع فقط</button>
          </div>
        </div>
        
        <div id="schedOut">
          {scheduleData && scheduleData.length > 0 && scheduleData[selectedWeekIdx] ? (
            <div id="selectedWeekCard" className="bg-white">
                <div className="print-wrap mb-4" style={{ direction: 'rtl', padding: '0 0 15mm 0' }}>
                {/* MODERN DARK HEADER CLICHÉ */}
                <div style={{ background: '#0a3d4d', color: 'white', padding: '20px 40px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', fontWeight: 'bold' }}>
                    المملكة العربية السعودية<br />
                    وزارة التعليم<br />
                    إدارة التعليم بمحافظة جدة<br />
                    ثانوية الأمير عبدالمجيد الأول
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>وزارة التعليم</div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', opacity: '0.8' }}>Ministry of Education</div>
                  </div>
                </div>
                
                <div style={{ padding: '0 15mm' }}>
                  <div className="text-center font-bold text-[14px] space-y-1 mb-6">
                    <div style={{ fontSize: '13px', color: '#666' }}>العام الدراسي {sYear} هـ</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', borderBottom: '2px solid #0a3d4d', display: 'inline-block', paddingBottom: '5px', marginBottom: '10px' }}>
                      جدول الإشراف اليومي والنمط الأسبوعي للأسبوع ( {selectedWeekIdx + sStartWeekNum} )
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[10px] print:text-[9.5px]">
                      <thead>
                        <tr className="bg-gray-50 text-center font-bold">
                          <th className="border-2 border-black p-1 bg-gray-100" rowSpan={2}>الأسبوع</th>
                          <th className="border-2 border-black p-1 bg-gray-100" rowSpan={2}>اليوم</th>
                          <th className="border-2 border-black p-1 bg-gray-100" rowSpan={2} style={{ minWidth: '70px' }}>التاريخ</th>
                          <th className="border-2 border-black p-1 bg-gray-100" colSpan={2}>المناوب العام</th>
                          <th className="border-2 border-black p-1 bg-gray-100" colSpan={3}>الإشراف اليومي</th>
                        </tr>
                        <tr className="bg-gray-50 text-center font-bold">
                          <th className="border-2 border-black p-0.5 w-[110px]">الاسم</th>
                          <th className="border-2 border-black p-0.5 w-[50px]">التوقيع</th>
                          <th className="border-2 border-black p-0.5">جهة الإشراف</th>
                          <th className="border-2 border-black p-0.5 w-[130px]">اسم المشرف</th>
                          <th className="border-2 border-black p-0.5 w-[50px]">التوقيع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleData[selectedWeekIdx].days.map((day, dIdx) => (
                          day.assignments.map((asg, aIdx) => {
                            const totalAssignments = day.assignments.length;
                            const weekRowSpan = scheduleData[selectedWeekIdx].days.reduce((acc, d) => acc + d.assignments.length, 0);
                            
                            return (
                              <tr key={`${dIdx}-${aIdx}`} className="leading-tight">
                                {dIdx === 0 && aIdx === 0 && (
                                  <td rowSpan={weekRowSpan} className="border-2 border-black text-center font-bold rotate-180 [writing-mode:vertical-rl] px-1 bg-gray-50 text-[10px]">
                                    الأسبوع {selectedWeekIdx + sStartWeekNum}
                                  </td>
                                )}
                                {aIdx === 0 && (
                                  <td rowSpan={totalAssignments} className="border-2 border-black text-center font-bold bg-white text-[10px] py-0.5">
                                    {DAYS[dIdx]}
                                  </td>
                                )}
                                {aIdx === 0 && (
                                  <td rowSpan={totalAssignments} className="border-2 border-black text-center whitespace-nowrap px-1 font-mono text-[9px]">
                                    {day.date || '-'}
                                  </td>
                                )}
                                {aIdx === 0 && (
                                  <td rowSpan={totalAssignments} className="border-2 border-black text-center font-bold text-[10px] py-0.5">
                                    {teachers[parseInt(day.supervisorIdx)]?.name || '-'}
                                  </td>
                                )}
                                {aIdx === 0 && (
                                  <td rowSpan={totalAssignments} className="border-2 border-black p-0"></td>
                                )}
                                
                                <td className="border-2 border-black text-right px-2 py-0.5 font-medium">{asg.area}</td>
                                <td className="border-2 border-black text-center px-1 py-0.5 min-w-[110px] text-[10px]">
                                  {teachers[parseInt(asg.teacherIdx)]?.name || '-'}
                                </td>
                                <td className="border-2 border-black p-0"></td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-between mt-10 p-2 text-xs font-bold pt-4">
                      <div className="text-center">
                        <p className="mb-10 text-[12px]">وكيل المدرسة للشؤون التعليمية</p>
                        <div className="border-b border-black w-40 mb-1 mx-auto text-[15px]">{sDep}</div>
                        <div className="text-[10px] font-normal">التوقيع</div>
                      </div>
                      <div className="text-center">
                        <p className="mb-10 text-[12px]">مدير المدرسة</p>
                        <div className="border-b border-black w-40 mb-1 mx-auto text-[15px]">{sPrinc}</div>
                        <div className="text-[10px] font-normal">التوقيع</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-4">📅</div>
              <div className="text-xl font-bold text-gray-400 mb-4">لا يوجد جدول جاهز حالياً</div>
              <p className="text-gray-500 mb-6">يرجى الضغط على زر "توليد الجدول" من صفحة الإعدادات أولاً</p>
              <button className="btn btn-primary btn-lg" onClick={() => setActivePage('setup')}>الذهاب للإعدادات 🚀</button>
            </div>
          )}
        </div>
      </div>
      {/* REPORT PAGE */}
      <div className={`page ${activePage === 'report' ? 'active' : ''}`}>
        <div className="card">
          <div className="card-title">📝 بيانات التقرير اليومي</div>
          <div className="form-row">
            <div className="form-group font-bold">
              <label>اليوم</label>
              <select value={rDay} onChange={e => setRDay(e.target.value)}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group relative font-bold">
              <label>التاريخ (هـ)</label>
              <div className="flex gap-2">
                <input 
                  value={rDate} 
                  readOnly 
                  onClick={() => setPickerTarget(prev => prev === 'report' ? null : 'report')} 
                  className="cursor-pointer bg-gray-50 font-mono text-center" 
                  placeholder="1447/11/3" 
                />
                <button className="btn btn-outline btn-sm" onClick={() => setPickerTarget(prev => prev === 'report' ? null : 'report')}>📅</button>
              </div>
              {pickerTarget === 'report' && <HijriCalendar />}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-6 space-y-8">
            <div className="p-4 border-2 border-dashed border-[#0F6E56]/20 rounded-xl bg-[#0F6E56]/5">
              <div className="text-[14px] font-bold text-[#0F6E56] mb-4 flex items-center gap-2">
                <span className="bg-[#0F6E56] text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px]">1</span>
                غياب المعلمين
              </div>
              <div className="flex gap-8 mb-4 px-4 font-semibold">
                <label className="flex items-center gap-2 cursor-pointer transition-all hover:text-[#0F6E56]">
                  <input type="radio" name="abs" value="no" checked={rAbs === 'no'} onChange={() => setRAbs('no')} className="w-5 h-5" /> 
                  لا يوجد غياب
                </label>
                <label className="flex items-center gap-2 cursor-pointer transition-all hover:text-[#0F6E56]">
                  <input type="radio" name="abs" value="yes" checked={rAbs === 'yes'} onChange={() => setRAbs('yes')} className="w-5 h-5" /> 
                  نعم (يوجد غياب) - حدد الغائبين أدناه:
                </label>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${rAbs === 'yes' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div id="abs-list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  {teachers.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] p-1.5 hover:bg-gray-50 rounded">
                      <input type="checkbox" id={`abs_list_${i}`} value={i} />
                      <label htmlFor={`abs_list_${i}`} className="truncate cursor-pointer">{t.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-[#0F6E56]/20 rounded-xl bg-[#0F6E56]/5">
              <div className="text-[14px] font-bold text-[#0F6E56] mb-4 flex items-center gap-2">
                <span className="bg-[#0F6E56] text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px]">2</span>
                توقيع المعلمين
              </div>
              <div className="flex gap-8 mb-4 px-4 font-semibold">
                <label className="flex items-center gap-2 cursor-pointer transition-all hover:text-[#0F6E56]">
                  <input type="radio" name="sig" value="yes" checked={rSig === 'yes'} onChange={() => setRSig('yes')} className="w-5 h-5" /> 
                  تَم التوقيع من الجميع
                </label>
                <label className="flex items-center gap-2 cursor-pointer transition-all hover:text-[#0F6E56]">
                  <input type="radio" name="sig" value="no" checked={rSig === 'no'} onChange={() => setRSig('no')} className="w-5 h-5" /> 
                  لم يتم التوقيع - حدد من لم يوقع:
                </label>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${rSig === 'no' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div id="sig-list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  {teachers.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] p-1.5 hover:bg-gray-50 rounded">
                      <input type="checkbox" id={`sig_list_${i}`} value={i} />
                      <label htmlFor={`sig_list_${i}`} className="truncate cursor-pointer">{t.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-[#0F6E56]/20 rounded-xl bg-[#0F6E56]/5">
              <div className="text-[14px] font-bold text-[#0F6E56] mb-4 flex items-center gap-2">
                <span className="bg-[#0F6E56] text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px]">3</span>
                تواجد المعلمين في مواقعهم
              </div>
              <div className="flex gap-8 mb-4 px-4 font-semibold">
                <label className="flex items-center gap-2 cursor-pointer transition-all hover:text-[#0F6E56]">
                  <input type="radio" name="prs" value="yes" checked={rPrs === 'yes'} onChange={() => setRPrs('yes')} className="w-5 h-5" /> 
                  جميع المعلمين متواجدون
                </label>
                <label className="flex items-center gap-2 cursor-pointer transition-all hover:text-[#0F6E56]">
                  <input type="radio" name="prs" value="no" checked={rPrs === 'no'} onChange={() => setRPrs('no')} className="w-5 h-5" /> 
                  لم يتواجد البعض - حدد القائمة:
                </label>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${rPrs === 'no' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div id="prs-list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  {teachers.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] p-1.5 hover:bg-gray-50 rounded">
                      <input type="checkbox" id={`prs_list_${i}`} value={i} />
                      <label htmlFor={`prs_list_${i}`} className="truncate cursor-pointer">{t.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group border border-gray-200 p-4 rounded-xl bg-white shadow-sm">
              <label className="text-[15px] font-bold text-gray-800 mb-3 block">4. ملاحظات (سلوكيات) / مرئيات أخرى</label>
              <textarea 
                value={rNotes} 
                onChange={e => setRNotes(e.target.value)} 
                rows={4} 
                className="w-full border-2 border-gray-100 focus:border-[#0F6E56] rounded-xl p-4 text-[14px] min-h-[120px] outline-none transition-all"
                placeholder="أدخل أي ملاحظات رصدتها اليوم أثناء الإشراف..."
              ></textarea>
            </div>
            
            <div className="flex items-center justify-center pt-6 border-t gap-4">
              <button className="px-8 py-3 bg-[#185FA5] text-white rounded-xl font-bold shadow-lg shadow-[#185FA5]/20 hover:scale-[1.02] transition-all flex items-center gap-2" onClick={genReport}>
                📄 توليد وتحميل التقرير
              </button>
              <button 
                className="px-8 py-3 bg-[#0F6E56] text-white rounded-xl font-bold shadow-lg shadow-[#0F6E56]/20 hover:scale-[1.02] transition-all flex items-center gap-2" 
                onClick={() => {
                  genReport();
                  setTimeout(() => doPrint('rpt'), 300);
                }}
              >
                🖨️ طباعة التقرير الفورية
              </button>
            </div>
          </div>
        </div>
        <div id="reportOut" className="hidden" dangerouslySetInnerHTML={{ __html: reportHtml }}></div>
      </div>

      {/* NOTIFY PAGE */}
      <div className={`page ${activePage === 'notify' ? 'active' : ''}`}>
        <div className="card">
          <div className="card-title">📲 التنبيه الأسبوعي - إرسال للكل</div>
          <div className="form-group mb-3">
            <label>نص الرسالة</label>
            <textarea value={wkMsg} onChange={e => setWkMsg(e.target.value)} rows={4}></textarea>
          </div>
          <button className="btn btn-wa" onClick={sendAll}>📲 إرسال للكل عبر واتساب</button>
        </div>

        <div className="card">
          <div className="card-title">📲 رسالة مخصصة لمعلم</div>
          <div className="form-row">
            <div className="form-group">
              <label>المعلم</label>
              <select value={mTeacherIdx} onChange={e => setMTeacherIdx(e.target.value)}>
                <option value="">-- اختر --</option>
                {teachers.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>نوع الرسالة</label>
              <select value={mType} onChange={e => setMType(e.target.value)}>
                <option value="weekly">تذكير بالتوقيع</option>
                <option value="absent">غياب غير مبرر</option>
                <option value="nosign">لم يوقع في السجل</option>
                <option value="nopos">غياب عن موقع الإشراف</option>
                <option value="custom">رسالة مخصصة</option>
              </select>
            </div>
          </div>
          <div className="form-group mb-3">
            <label>نص الرسالة</label>
            <textarea value={mMsg} onChange={e => setMMsg(e.target.value)} rows={3}></textarea>
          </div>
          <button className="btn btn-wa" onClick={sendOne}>📲 إرسال عبر واتساب</button>
        </div>

        <div className="card">
          <div className="card-title">📋 سجل الإرسال ({msgLogs.length})</div>
          <div id="msgLog">
            {msgLogs.length === 0 ? (
              <p className="text-[12px] text-[#888]">لم يتم إرسال أي رسائل بعد.</p>
            ) : (
              msgLogs.slice(0, 20).map((l, i) => (
                <div key={i} className="msg-log-item">
                  <span className="text-[#888]">{l.time}</span> — <b>{l.to}</b><br />
                  <span className="text-[#555]">{l.msg.substring(0, 70)}{l.msg.length > 70 ? '...' : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
