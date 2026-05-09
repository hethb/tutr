import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, Search, Check, Plus, GraduationCap } from 'lucide-react';
import clsx from 'clsx';
import { fetchCourses, fetchDepartments, Course } from '../services/api';

interface CourseSelectorProps {
  selectedCourse: Course | null;
  onSelectCourse: (course: Course | null) => void;
}

export default function CourseSelector({ selectedCourse, onSelectCourse }: CourseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [university, setUniversity] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
    fetchCourses().then(setCourses).catch(() => {});
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesDept = !selectedDept || c.department === selectedDept;
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleCustomSubmit = () => {
    if (!university.trim() && !courseNumber.trim()) return;
    const customCourse: Course = {
      id: `custom_${Date.now()}`,
      name: courseName.trim() || `${courseNumber.trim()}`,
      department: university.trim() || 'Custom',
      topics: [],
      custom: true,
      university: university.trim(),
      courseNumber: courseNumber.trim(),
    };
    onSelectCourse(customCourse);
    setIsOpen(false);
    setShowCustom(false);
  };

  const displayText = selectedCourse
    ? selectedCourse.custom
      ? `${selectedCourse.university}${selectedCourse.courseNumber ? ' — ' + selectedCourse.courseNumber : ''}${selectedCourse.name && selectedCourse.name !== selectedCourse.courseNumber ? ' — ' + selectedCourse.name : ''}`
      : selectedCourse.name
    : null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
          selectedCourse
            ? 'glass border border-tutr-accent/30'
            : 'glass-light hover:border-tutr-accent/20',
        )}
      >
        <BookOpen size={18} className="text-tutr-accent flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {selectedCourse ? (
            <>
              <p className="text-sm font-medium truncate">{displayText}</p>
              <p className="text-[10px] text-gray-500">
                {selectedCourse.custom ? selectedCourse.university : selectedCourse.department}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Select or enter your course</p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={clsx('text-gray-500 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="glass rounded-xl overflow-hidden">
          {/* Custom course entry toggle */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setShowCustom(false)}
              className={clsx(
                'flex-1 py-2.5 text-xs font-medium transition-all',
                !showCustom ? 'bg-tutr-accent text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              Browse Courses
            </button>
            <button
              onClick={() => setShowCustom(true)}
              className={clsx(
                'flex-1 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                showCustom ? 'bg-tutr-accent text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              <GraduationCap size={13} />
              My Course
            </button>
          </div>

          {showCustom ? (
            <div className="p-3 space-y-3">
              <p className="text-xs text-gray-400">
                Enter your university and course number for personalized tutoring.
              </p>
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">University</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. MIT, Stanford, UC Berkeley"
                  className="w-full mt-1 px-3 py-2 bg-tutr-darker rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-tutr-accent/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Course Number</label>
                <input
                  type="text"
                  value={courseNumber}
                  onChange={(e) => setCourseNumber(e.target.value)}
                  placeholder="e.g. CS 6.006, MATH 241, PHYS 101"
                  className="w-full mt-1 px-3 py-2 bg-tutr-darker rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-tutr-accent/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Course Name (optional)</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Introduction to Algorithms"
                  className="w-full mt-1 px-3 py-2 bg-tutr-darker rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-tutr-accent/50"
                />
              </div>
              <button
                onClick={handleCustomSubmit}
                disabled={!university.trim() && !courseNumber.trim()}
                className="w-full py-2.5 bg-tutr-accent hover:bg-tutr-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
              >
                Set Course
              </button>
            </div>
          ) : (
            <>
              <div className="p-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full pl-8 pr-3 py-2 bg-tutr-darker rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-tutr-accent/50"
                  />
                </div>
              </div>

              <div className="flex gap-1 px-2 pb-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedDept(null)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all',
                    !selectedDept ? 'bg-tutr-accent text-white' : 'bg-tutr-darker text-gray-400 hover:text-white',
                  )}
                >
                  All
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept === selectedDept ? null : dept)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all',
                      dept === selectedDept
                        ? 'bg-tutr-accent text-white'
                        : 'bg-tutr-darker text-gray-400 hover:text-white',
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <div className="max-h-48 overflow-y-auto">
                {selectedCourse && (
                  <button
                    onClick={() => { onSelectCourse(null); setIsOpen(false); }}
                    className="w-full px-3 py-2 text-left hover:bg-tutr-surface-light text-sm text-gray-400 border-b border-gray-800"
                  >
                    Clear selection
                  </button>
                )}
                {filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => { onSelectCourse(course); setIsOpen(false); }}
                    className={clsx(
                      'w-full px-3 py-2.5 text-left hover:bg-tutr-surface-light flex items-center gap-2 transition-all',
                      selectedCourse?.id === course.id && 'bg-tutr-accent/10',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{course.name}</p>
                      <p className="text-[10px] text-gray-500">{course.department} · {course.id.toUpperCase()}</p>
                    </div>
                    {selectedCourse?.id === course.id && (
                      <Check size={14} className="text-tutr-accent flex-shrink-0" />
                    )}
                  </button>
                ))}
                {filteredCourses.length === 0 && (
                  <p className="text-center py-4 text-sm text-gray-500">No courses found</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
