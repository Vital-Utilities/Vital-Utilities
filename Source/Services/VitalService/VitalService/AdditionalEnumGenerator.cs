using Reinforced.Typings;
using Reinforced.Typings.Ast;
using Reinforced.Typings.Generators;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Text;

public class AdditionalEnumGenerator : EnumGenerator
{
    public override RtEnum GenerateNode(Type element, RtEnum result, TypeResolver resolver)
    {
        var resultEnum = base.GenerateNode(element, result, resolver);
        resultEnum.Export = true;
        if (Context.Location.CurrentNamespace != null)
        {
            Context.Location.CurrentNamespace.CompilationUnits.Add(resultEnum);

            StringBuilder enumdescriptor = new StringBuilder();
            enumdescriptor.AppendLine();
            enumdescriptor.AppendLine($"export const {resultEnum.EnumName}NameMapping = new Map<{resultEnum.EnumName}, string>([");
            bool first = true;

            foreach (var resultEnumValue in resultEnum.Values)
            {
                if (!first) enumdescriptor.AppendLine(",");
                first = false;
                var f = Enum.Parse(element, resultEnumValue.EnumValueName) as Enum;
                var enumDescription = f is not null ? GetEnumDescription(f) : resultEnumValue.EnumValueName;

                enumdescriptor.Append($"[{resultEnum.EnumName}.{resultEnumValue.EnumValueName},'{enumDescription}']");
            }
            enumdescriptor.AppendLine("]);");

            Context.Location.CurrentNamespace.CompilationUnits.Add(new RtRaw(enumdescriptor.ToString()));

        }

        return null;
    }

    public static string GetEnumDescription(Enum value)
    {
        var fi = value.GetType().GetField(value.ToString());

        var attributes = fi?.GetCustomAttributes(typeof(DescriptionAttribute), false) as DescriptionAttribute[];

        if (attributes != null && attributes.Any())
        {
            return attributes.First().Description;
        }

        return value.ToString();
    }
}