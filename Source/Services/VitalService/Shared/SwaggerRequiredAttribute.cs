using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace VitalService
{

    public class SwaggerRequiredSchemaFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            PropertyInfo[] properties = context.Type.GetProperties();
            if (schema.Required == null)
                schema.Required = new HashSet<string>();
            foreach (PropertyInfo property in properties)
            {
                var propertyNameInCamelCasing = char.ToLowerInvariant(property.Name[0]) + property.Name[1..];
                var nullabilityContext = new NullabilityInfoContext();
                var nullabilityInfo = nullabilityContext.Create(property);
                if (nullabilityInfo.WriteState is not NullabilityState.Nullable)
                    schema.Required.Add(propertyNameInCamelCasing);
            }
            schema.Nullable = false;
        }
    }
}
