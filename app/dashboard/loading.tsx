export default function Loading() {
  return (
    <div className="p-4 w-full flex flex-col gap-4">
      {/* chart and form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full md:h-64">
        
        {/* circle */}
        <div className="flex flex-col gap-4 p-2 w-full rounded-lg border-2 border-muted-foreground items-center justify-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted-foreground"></div>
        </div>
        
        {/* form */}
        <div className="flex flex-col gap-4 p-2 w-full rounded-lg border-2 border-muted-foreground">
          <div className="h-8 animate-pulse rounded-md bg-muted-foreground"></div>
          <div className="h-8 animate-pulse rounded-md bg-muted-foreground"></div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 animate-pulse rounded-md bg-muted-foreground"></div>
            <div className="h-8 animate-pulse rounded-md bg-muted-foreground"></div>
          </div>
          
          <div className="h-8 animate-pulse rounded-md bg-muted-foreground"></div>
          <div className="h-8 w-1/5 ml-auto animate-pulse rounded-md bg-muted-foreground"></div>
        </div>
      </div>
      
      {/* table */}
      <div className="flex flex-col h-64 w-full gap-4 p-2 rounded-lg border-2 border-muted-foreground">
        <div className="h-full animate-pulse rounded-md bg-muted-foreground"></div>
      </div>
    </div>
  );
}