import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Database, 
  FolderGit2, 
  Share2, 
  BarChart3, 
  UserSquare2, 
  LineChart, 
  Wallet, 
  FileText, 
  ShieldAlert, 
  Settings, 
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Command Center' },
  { id: 'copilot', label: 'AI Crime Copilot', icon: MessageSquare, category: 'Intelligence' },
  { id: 'database', label: 'Crime Database', icon: Database, category: 'Intelligence' },
  { id: 'investigations', label: 'Investigations', icon: FolderGit2, category: 'Intelligence' },
  { id: 'network', label: 'Criminal Network', icon: Share2, category: 'Intelligence' },
  { id: 'analytics', label: 'Crime Analytics', icon: BarChart3, category: 'Analysis' },
  { id: 'profiling', label: 'Offender Profiling', icon: UserSquare2, category: 'Analysis' },
  { id: 'financial', label: 'Financial Intelligence', icon: Wallet, category: 'Analysis' },
  { id: 'forecasting', label: 'Crime Forecasting', icon: LineChart, category: 'Analysis' },
  { id: 'reports', label: 'Reports', icon: FileText, category: 'System' },
  { id: 'audit', label: 'Audit Logs', icon: ShieldAlert, category: 'System' },
  { id: 'agent-monitoring', label: 'Agent Monitoring', icon: Activity, category: 'System' },
  { id: 'settings', label: 'Settings', icon: Settings, category: 'System' },
];

const categories = Array.from(new Set(menuItems.map(item => item.category)));

export const Sidebar = React.memo<SidebarProps>(({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed 
}) => {

  return (
    <aside 
      style={{ 
        width: collapsed ? '72px' : '280px', 
        minWidth: collapsed ? '72px' : '280px',
        flexShrink: 0,
        borderRadius: 0,
        backgroundColor: '#090909',
        zIndex: 50,
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05]" style={{ height: '70px', padding: '0 20px' }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ 
              width: '38px', 
              height: '38px', 
              background: 'linear-gradient(135deg, #FF7A00 0%, #CC3300 100%)',
              boxShadow: '0 0 15px rgba(255, 122, 0, 0.4)'
            }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-bold text-sm tracking-tight text-white font-heading leading-tight uppercase">KSP Crime Copilot</span>
              <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase leading-none mt-1">Intelligence Platform</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '16px 8px' : '16px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {categories.map(category => (
            <div key={category}>
              {!collapsed && (
                <h3 style={{ 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  color: '#71717a', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em', 
                  padding: '0 12px', 
                  marginBottom: '10px',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {category}
                </h3>
              )}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {menuItems
                  .filter(item => item.category === category)
                  .map(item => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <li key={item.id} className="tooltip-container">
                        <button
                          onClick={() => setActiveTab(item.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: collapsed ? '10px' : '10px 14px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: isActive ? '#FFFFFF' : '#A3A3A3',
                            backgroundColor: isActive ? 'rgba(255, 122, 0, 0.08)' : 'transparent',
                            border: isActive ? '1px solid rgba(255, 122, 0, 0.25)' : 'none',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                          }}
                          className="group"
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.color = '#fff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#A3A3A3';
                            }
                          }}
                        >
                          {/* Active indicator — moved 10px from left */}
                          {isActive && (
                            <div 
                              style={{
                                position: 'absolute',
                                left: '4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3px',
                                height: '55%',
                                backgroundColor: '#FF7A00',
                                borderRadius: '0 4px 4px 0',
                              }}
                            />
                          )}
                          <Icon 
                            size={18} 
                            style={{
                              flexShrink: 0,
                              color: isActive ? '#FF7A00' : '#a1a1aa',
                              transition: 'transform 0.3s ease',
                            }}
                          />
                          {!collapsed && (
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                          )}
                        </button>
                        {collapsed && (
                          <span className="tooltip-text font-medium">{item.label}</span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile / Status Footer */}
      <div style={{ 
        padding: '14px 16px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
        backgroundColor: 'rgba(9, 9, 11, 0.4)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                color: '#FF7A00',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(255, 122, 0, 0.1)',
              }}
            >
              SP
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left overflow-hidden animate-fade-in">
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Suresh Patil</span>
                <span style={{ fontSize: '10px', color: '#a1a1aa' }}>Investigator (L3)</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button 
              className="p-1.5 rounded-md hover:bg-[#FF3B30]/10 text-zinc-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
});
