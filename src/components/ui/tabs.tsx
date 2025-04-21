"use client"

import * as React from "react"
import { motion, PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string
  onChange: (value: string) => void
  enableSwipe: boolean
  handleSwipe: (direction: "left" | "right") => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a TabsProvider")
  }
  return context
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
  disableSwipe?: boolean
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  disableSwipe = false,
  ...props
}: TabsProps) {
  const [tabValue, setTabValue] = React.useState(defaultValue)
  const tabsRef = React.useRef<Array<string>>([])
  
  // Extract TabsTrigger values from children
  React.useEffect(() => {
    const tabsValues: string[] = [];
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as Record<string, unknown>;
        
        if (childProps.children) {
          const childrenArray = React.Children.toArray(childProps.children as React.ReactNode);
          if (Array.isArray(childrenArray)) {
            React.Children.forEach(childProps.children as React.ReactNode, (subChild) => {
              if (React.isValidElement(subChild)) {
                const subChildProps = subChild.props as Record<string, unknown>;
                if (typeof subChildProps.value === 'string') {
                  tabsValues.push(subChildProps.value);
                }
              }
            });
          }
        }
      }
    });
    
    tabsRef.current = tabsValues;
  }, [children]);
  
  const onChange = React.useCallback((newValue: string) => {
    setTabValue(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])
  
  const handleSwipe = React.useCallback((direction: "left" | "right") => {
    if (disableSwipe) return;
    
    const currentIndex = tabsRef.current.indexOf(value ?? tabValue);
    if (currentIndex === -1) return;
    
    if (direction === "left" && currentIndex < tabsRef.current.length - 1) {
      onChange(tabsRef.current[currentIndex + 1]);
    } else if (direction === "right" && currentIndex > 0) {
      onChange(tabsRef.current[currentIndex - 1]);
    }
  }, [disableSwipe, onChange, tabValue, value]);
  
  const contextValue = React.useMemo(() => ({
    value: value ?? tabValue,
    onChange,
    enableSwipe: !disableSwipe,
    handleSwipe
  }), [value, tabValue, onChange, disableSwipe, handleSwipe])
  
  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export function TabsList({
  className,
  children,
  ...props
}: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  className?: string
  children: React.ReactNode
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onChange } = useTabsContext()
  const isActive = selectedValue === value
  
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative",
        isActive
          ? "bg-background text-foreground shadow-sm elevation-1"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  className?: string
  children: React.ReactNode
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { value: selectedValue, enableSwipe, handleSwipe } = useTabsContext()
  const isActive = selectedValue === value
  
  const handleDragEnd = React.useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enableSwipe) return;
      
      const { offset } = info;
      if (offset.x < -50) {
        handleSwipe("left");
      } else if (offset.x > 50) {
        handleSwipe("right");
      }
    },
    [enableSwipe, handleSwipe]
  );
  
  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive ? "block" : "hidden",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}
