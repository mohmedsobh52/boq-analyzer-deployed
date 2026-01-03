import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.projects': 'Projects',
    'nav.dashboard': 'Dashboard',
    'nav.analysis': 'Analysis',
    'nav.suppliers': 'Suppliers',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.language': 'Language',
    
    // Dashboard
    'dashboard.title': 'BOQ Analyzer Dashboard',
    'dashboard.welcome': 'Welcome to BOQ Analyzer',
    'dashboard.createProject': 'Create New Project',
    'dashboard.recentProjects': 'Recent Projects',
    'dashboard.totalProjects': 'Total Projects',
    'dashboard.totalCost': 'Total Cost',
    'dashboard.activeProjects': 'Active Projects',
    
    // Projects
    'projects.title': 'Projects',
    'projects.new': 'New Project',
    'projects.name': 'Project Name',
    'projects.description': 'Description',
    'projects.status': 'Status',
    'projects.created': 'Created',
    'projects.updated': 'Updated',
    'projects.actions': 'Actions',
    'projects.edit': 'Edit',
    'projects.delete': 'Delete',
    'projects.view': 'View',
    
    // BOQ Items
    'boq.title': 'Bill of Quantities',
    'boq.itemCode': 'Item Code',
    'boq.description': 'Description',
    'boq.unit': 'Unit',
    'boq.quantity': 'Quantity',
    'boq.unitPrice': 'Unit Price',
    'boq.totalPrice': 'Total Price',
    'boq.category': 'Category',
    'boq.wbs': 'WBS Code',
    'boq.addItem': 'Add Item',
    'boq.importFile': 'Import File',
    'boq.exportExcel': 'Export to Excel',
    'boq.exportPDF': 'Export to PDF',
    
    // Cost Analysis
    'cost.title': 'Cost Analysis',
    'cost.materialCost': 'Material Cost',
    'cost.laborCost': 'Labor Cost',
    'cost.equipmentCost': 'Equipment Cost',
    'cost.contingency': 'Contingency',
    'cost.profitMargin': 'Profit Margin',
    'cost.finalCost': 'Final Cost',
    'cost.summary': 'Cost Summary',
    'cost.breakdown': 'Cost Breakdown',
    
    // Suppliers
    'supplier.title': 'Suppliers',
    'supplier.name': 'Supplier Name',
    'supplier.email': 'Email',
    'supplier.phone': 'Phone',
    'supplier.address': 'Address',
    'supplier.quotations': 'Quotations',
    'supplier.compare': 'Compare Quotations',
    'supplier.add': 'Add Supplier',
    
    // File Upload
    'file.upload': 'Upload File',
    'file.selectFile': 'Select File',
    'file.dragDrop': 'Drag and drop files here',
    'file.supportedFormats': 'Supported formats: Excel, CSV',
    'file.uploading': 'Uploading...',
    'file.uploaded': 'File uploaded successfully',
    'file.error': 'Error uploading file',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.currency': 'USD',
  },
  ar: {
    // Navigation
    'nav.projects': 'المشاريع',
    'nav.dashboard': 'لوحة التحكم',
    'nav.analysis': 'التحليل',
    'nav.suppliers': 'الموردون',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'nav.language': 'اللغة',
    
    // Dashboard
    'dashboard.title': 'لوحة تحكم محلل BOQ',
    'dashboard.welcome': 'مرحبا بك في محلل BOQ',
    'dashboard.createProject': 'إنشاء مشروع جديد',
    'dashboard.recentProjects': 'المشاريع الأخيرة',
    'dashboard.totalProjects': 'إجمالي المشاريع',
    'dashboard.totalCost': 'التكلفة الإجمالية',
    'dashboard.activeProjects': 'المشاريع النشطة',
    
    // Projects
    'projects.title': 'المشاريع',
    'projects.new': 'مشروع جديد',
    'projects.name': 'اسم المشروع',
    'projects.description': 'الوصف',
    'projects.status': 'الحالة',
    'projects.created': 'تم الإنشاء',
    'projects.updated': 'تم التحديث',
    'projects.actions': 'الإجراءات',
    'projects.edit': 'تعديل',
    'projects.delete': 'حذف',
    'projects.view': 'عرض',
    
    // BOQ Items
    'boq.title': 'جدول الكميات والأسعار',
    'boq.itemCode': 'رمز البند',
    'boq.description': 'الوصف',
    'boq.unit': 'الوحدة',
    'boq.quantity': 'الكمية',
    'boq.unitPrice': 'سعر الوحدة',
    'boq.totalPrice': 'السعر الإجمالي',
    'boq.category': 'الفئة',
    'boq.wbs': 'رمز WBS',
    'boq.addItem': 'إضافة بند',
    'boq.importFile': 'استيراد ملف',
    'boq.exportExcel': 'تصدير إلى Excel',
    'boq.exportPDF': 'تصدير إلى PDF',
    
    // Cost Analysis
    'cost.title': 'تحليل التكاليف',
    'cost.materialCost': 'تكلفة المواد',
    'cost.laborCost': 'تكلفة العمالة',
    'cost.equipmentCost': 'تكلفة المعدات',
    'cost.contingency': 'الاحتياطي',
    'cost.profitMargin': 'هامش الربح',
    'cost.finalCost': 'التكلفة النهائية',
    'cost.summary': 'ملخص التكاليف',
    'cost.breakdown': 'تفصيل التكاليف',
    
    // Suppliers
    'supplier.title': 'الموردون',
    'supplier.name': 'اسم المورد',
    'supplier.email': 'البريد الإلكتروني',
    'supplier.phone': 'الهاتف',
    'supplier.address': 'العنوان',
    'supplier.quotations': 'العروض',
    'supplier.compare': 'مقارنة العروض',
    'supplier.add': 'إضافة مورد',
    
    // File Upload
    'file.upload': 'تحميل ملف',
    'file.selectFile': 'اختر ملف',
    'file.dragDrop': 'اسحب الملفات هنا',
    'file.supportedFormats': 'الصيغ المدعومة: Excel، CSV',
    'file.uploading': 'جاري التحميل...',
    'file.uploaded': 'تم تحميل الملف بنجاح',
    'file.error': 'خطأ في تحميل الملف',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.confirm': 'تأكيد',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.currency': 'USD',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL: language === 'ar' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
