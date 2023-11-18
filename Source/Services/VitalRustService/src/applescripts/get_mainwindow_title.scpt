on get_window_title(pid)
   tell application "System Events"
       set proc to first process whose unix id is pid
       set win to first window of proc
       return name of win
   end tell
end get_window_title
