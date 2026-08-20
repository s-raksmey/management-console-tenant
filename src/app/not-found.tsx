"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  FileText, 
  LayoutDashboard,
  AlertTriangle 
} from "lucide-react";
import { useAdminLocale } from "@/hooks/useAdminLocale";

export default function NotFound() {
  const { locale } = useAdminLocale();
  const copy = {
    en: {
      title: "Oops! Page Not Found",
      description: "The page you're looking for could not be found. It may have moved, or the link may be outdated.",
      dashboard: "Back to Dashboard",
      goBack: "Go Back",
      quickLinks: "Quick Links",
      dashboardLink: "Dashboard",
      articles: "Articles",
      search: "Search",
      help: "If you believe this is an error, please contact the administrator or try refreshing the page.",
    },
    km: {
      title: "រកមិនឃើញទំព័រ",
      description: "រកមិនឃើញទំព័រដែលអ្នកកំពុងស្វែងរកទេ។ វាអាចត្រូវបានផ្លាស់ទី ឬតំណអាចលែងត្រឹមត្រូវ។",
      dashboard: "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង",
      goBack: "ត្រឡប់ក្រោយ",
      quickLinks: "តំណរហ័ស",
      dashboardLink: "ផ្ទាំងគ្រប់គ្រង",
      articles: "អត្ថបទ",
      search: "ស្វែងរក",
      help: "ប្រសិនបើអ្នកគិតថានេះជាបញ្ហា សូមទាក់ទងអ្នកគ្រប់គ្រង ឬព្យាយាមធ្វើឱ្យទំព័រថ្មី។",
    },
  }[locale];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Animated 404 Number */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="relative"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 select-none"
          >
            404
          </motion.h1>
          <motion.div
            variants={itemVariants}
            className="absolute -top-4 -right-4 text-yellow-500"
          >
            <AlertTriangle className="w-8 h-8 md:w-12 md:h-12" />
          </motion.div>
        </motion.div>

        {/* Error Message */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800">
            {copy.title}
          </h2>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            {copy.description}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/">
            <Button size="default" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
              <Home className="w-4 h-4 mr-2" />
              {copy.dashboard}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="default" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-50 px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {copy.goBack}
          </Button>
        </motion.div>

        {/* Quick Links Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {copy.quickLinks}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/" className="group">
                  <div className="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <LayoutDashboard className="w-5 h-5 text-blue-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-slate-700">{copy.dashboardLink}</span>
                  </div>
                </Link>
                
                <Link href="/articles" className="group">
                  <div className="flex items-center p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                    <FileText className="w-5 h-5 text-green-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-slate-700">{copy.articles}</span>
                  </div>
                </Link>
                
                <div className="group cursor-pointer">
                  <div className="flex items-center p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200">
                    <Search className="w-5 h-5 text-purple-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-slate-700">{copy.search}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.div variants={itemVariants}>
          <p className="text-sm text-slate-500">
            {copy.help}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
