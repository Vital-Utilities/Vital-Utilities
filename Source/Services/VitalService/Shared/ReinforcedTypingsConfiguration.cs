using Reinforced.Typings.Ast.TypeNames;
using Reinforced.Typings.Fluent;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using VitalService.Dtos;
using ConfigurationBuilder = Reinforced.Typings.Fluent.ConfigurationBuilder;

namespace ReinforcedTypings
{
    public static class ReinforcedTypingsConfiguration
    {
        public static void Configure(ConfigurationBuilder builder)
        {
            // fluent configuration goes here
            var webDtos = Assembly.GetAssembly(typeof(ReinforcedTypingsConfiguration))
                .GetTypes()
                .Where(x => x.Namespace?.StartsWith("VitalService.Dtos") == true)
                .ToArray();
            builder.Substitute(typeof(Guid), new RtSimpleTypeName("string"))
                .Substitute(typeof(DateTime), new RtSimpleTypeName("Date"))
                .Substitute(typeof(DateTimeOffset), new RtSimpleTypeName("Date"))
                .Substitute(typeof(TimeSpan), new RtSimpleTypeName("string"));

            builder.Global(
                config => config
                .CamelCaseForProperties(true)
                .AutoOptionalProperties()
                .CamelCaseForMethods(false)
                .UseModules(true, true));

            builder.ExportAsEnums(webDtos.Where(e => e.IsEnum), conf =>
            {
                conf.FlattenHierarchy().UseString(true);
            });

            builder.ExportAsEnum<DriveType>().UseString();
            //builder.ExportAsEnum<ProcessPriorityEnum>().WithCodeGenerator<AdditionalEnumGenerator>();
            foreach (var type in webDtos.Where(e => !e.IsEnum && !e.IsInterface))
            {
                builder.ExportAsInterfaces(
                    new[] { type },
                    conf =>
                    {
                        conf.FlattenHierarchy()
                            .WithPublicProperties(
                                e =>
                                {
                                    e.CamelCase();
                                    var isNullabe = Nullable.GetUnderlyingType(type.GetProperty(e.Member.Name).PropertyType);
                                    if (isNullabe != null)
                                    {
                                        e.ForceNullable();
                                    }
                                })
                            .AutoI(false);
                    });
            }
        }
    }
}
