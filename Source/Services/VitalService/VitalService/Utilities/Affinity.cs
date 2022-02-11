using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using VitalService.Dtos;

namespace VitalService.Utilities
{
    public static class Affinity
    {
        public static ProcessPriorityClass? ToWindowsObject(this ProcessPriorityEnum processPriorityEnum)
        {
            if (processPriorityEnum == ProcessPriorityEnum.DontOverride)
                return null;
#pragma warning disable CS8604 // Possible null reference argument.
            return (ProcessPriorityClass)Enum.Parse(typeof(ProcessPriorityClass), Enum.GetName(typeof(ProcessPriorityEnum), processPriorityEnum));
#pragma warning restore CS8604 // Possible null reference argument.
        }

        public static ProcessPriorityEnum ToDomainObject(this ProcessPriorityClass processPriorityEnum)
        {
#pragma warning disable CS8604 // Possible null reference argument.
            return (ProcessPriorityEnum)Enum.Parse(typeof(ProcessPriorityEnum), Enum.GetName(typeof(ProcessPriorityClass), processPriorityEnum));
#pragma warning restore CS8604 // Possible null reference argument.
        }
        public static IntPtr BinaryToIntPtr(string binary)
        {

            int result = Convert.ToInt32(new string(binary.Reverse().ToArray()), 2);
            return new IntPtr(result);
        }

        public static string IntArrayToBinaryString(int[] array)
        {
            var affinityArray = new int[Environment.ProcessorCount];

            foreach (var thread in array)
            {
                affinityArray[thread] = 1;
            }
            return string.Join("", affinityArray);
        }

        public static int[] BinaryStringToIntArray(string binary)
        {
            var binaryArray = binary.Select(e => int.Parse(e.ToString())).ToArray();
            var normalizedList = new List<int>();

            for (int i = 0; i < binaryArray.Length; i++)
            {
                if (binaryArray[i] == 1)
                    normalizedList.Add(i);
            }
            return normalizedList.ToArray();
        }

        public static int[] IntPtrToBinary(IntPtr hex)
        {
            var hexVal = hex.ToInt32();

            var result = Convert.ToString(hexVal, 2);
            return result.Select(e => int.Parse(e.ToString())).ToArray();
        }
    }

}

