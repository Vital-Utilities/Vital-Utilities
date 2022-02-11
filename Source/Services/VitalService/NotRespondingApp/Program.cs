using System;
using System.Threading;
using System.Windows.Forms;

namespace NotRespondingApp
{
    static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Thread.Sleep(TimeSpan.FromDays(double.PositiveInfinity));

            Application.Run(new Form1());
        }
    }
}
